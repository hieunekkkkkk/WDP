// services/conversationService.js
const conversationController = require("../controllers/conversation.controller");
// SỬA Ở ĐÂY: Import toàn bộ đối tượng và đặt tên là 'redis'
const redis = require("../utils/redis");

let io;

const chatGateway = {
  init: (server) => {
    io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // SỬA Ở ĐÂY: Dùng hàm .subscribe() từ đối tượng 'redis'
    // Hàm này sẽ tạo ra một subscriber và nhận một callback
    const redisSubscriber = redis.subscribe("chat_messages", (parsed) => {
      // Hàm helper 'subscribe' của bạn đã tự động parse JSON
      io.to(parsed.receiver_id).emit("receive_message", parsed);
    });

    // Code bên dưới không cần thay đổi, nhưng 'on.message'
    // đã được chuyển vào hàm callback ở trên.

    // redisSubscriber.on("message", (channel, message) => {
    //   if (channel === "chat_messages") {
    //     const parsed = JSON.parse(message);
    //     io.to(parsed.receiver_id).emit("receive_message", parsed);
    //   }
    // });

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

          // SỬA Ở ĐÂY: Dùng hàm .publish() từ đối tượng 'redis'
          await redis.publish(
            "chat_messages",
            JSON.stringify(saved.senderMessage)
          );
          io.to(data.receiver_id).emit("receive_message", saved.senderMessage);
          //ad noti
          io.to(data.receiver_id).emit("new_notification", {
            id: saved.senderMessage.ts,
            sender_id: data.sender_id,
            message: data.message.length > 30 ? data.message.substring(0, 30) + "..." : data.message
          });
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
          //add noti
          socket.emit("new_notification", {
            id: result.receiverMessage.ts,
            sender_id: data.receiver_id,
            message: result.receiverMessage.message.length > 30 ? result.receiverMessage.message.substring(0, 30) + "..." : result.receiverMessage.message
          });
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