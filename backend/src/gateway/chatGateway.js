const conversationController = require("../controllers/conversation.controller");
const { redisClient, redisSubscriber } = require("../utils/redis");

let io;

const chatGateway = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Sub Redis để sync message khi scale nhiều instance
    redisSubscriber.subscribe("chat_messages");
    redisSubscriber.on("message", (channel, message) => {
      if (channel === "chat_messages") {
        const parsed = JSON.parse(message);
        io.to(parsed.receiver_id).emit("receive_message", parsed);
      }
    });

    io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // User join theo userId
      socket.on("join", (userId) => {
        socket.join(userId);
        console.log(`👤 User ${userId} joined room`);
      });

      // Human ↔ Human
      socket.on("send_message_socket", async (data) => {
        try {
          const saved = await conversationController.socketSendMessage(data);

          await redisClient.publish(
            "chat_messages",
            JSON.stringify(saved.senderMessage)
          );
          io.to(data.receiver_id).emit("receive_message", saved.senderMessage);

          socket.emit("message_sent", saved.senderMessage);
        } catch (err) {
          console.error("❌ Error send_message_socket:", err);
          socket.emit("error", { error: err.message });
        }
      });

      // Human ↔ Bot
      socket.on("send_message_bot", async (data) => {
        try {
          // gọi thẳng lại service qua controller sendMessage nhưng custom type = bot
          const result = await conversationController.sendMessage(
            {
              params: { chatId: data.chatId },
              query: { type: "bot" },
              body: {
                sender_id: data.sender_id,
                receiver_id: data.receiver_id,
                message: data.message,
              },
            },
            {
              json: (payload) => payload, // fake res.json cho phù hợp với controller
              status: () => ({ json: (payload) => payload }),
            }
          );

          // Emit bot reply cho sender
          socket.emit("receive_message", result.receiverMessage);
          socket.emit("message_sent", result.senderMessage);
        } catch (err) {
          console.error("❌ Error send_message_bot:", err);
          socket.emit("error", { error: err.message });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❎ User disconnected: ${socket.id}`);
      });
    });

    console.log("✅ ChatGateway initialized");
  },
};

module.exports = chatGateway;
