const conversationService = require("../services/conversation.service");
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

    // Subscribe Redis để sync messages giữa các server instances
    redis.subscribe("chat_messages", (parsed) => {
      console.log("📢 Redis pub/sub received:", parsed);
      io.to(parsed.chatId).emit("receive_message", parsed);
    });

    io.on("connection", (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Join user room for notifications
      socket.on("join", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`🔔 Socket ${socket.id} joined notification room: user_${userId}`);
      });

      // Join chat room
      socket.on("join_chat", (chatId) => {
        socket.join(chatId);
        console.log(`👤 Socket ${socket.id} joined room: ${chatId}`);
      });

      // Human mode: Student hoặc Business gửi tin nhắn
      socket.on("send_message", async (data) => {
        try {
          const { chatId, sender_id, receiver_id, message, message_who } = data;

          console.log("📤 send_message received:", { chatId, sender_id, receiver_id, message_who });

          // Kiểm tra socket có trong room không
          const rooms = Array.from(socket.rooms);
          console.log("🔍 Socket rooms:", rooms);
          console.log("🔍 Socket in chatId room?", rooms.includes(chatId));

          // Lưu tin nhắn vào Redis
          const savedMessage = await conversationService.saveMessage({
            chatId,
            sender_id,
            receiver_id,
            message,
            message_who
          });

          const messageWithChatId = {
            ...savedMessage,
            chatId: chatId
          };

          console.log("✅ Message saved, emitting to room:", chatId);
          console.log("📢 Emitting message:", messageWithChatId);

          // Emit tới TẤT CẢ users trong chatId room (bao gồm cả người gửi)
          io.to(chatId).emit("receive_message", messageWithChatId);

          // Publish để sync với các server instances khác
          await redis.publish("chat_messages", JSON.stringify(messageWithChatId));

          // Emit notification tới receiver (nếu họ không trong room chat)
          const notification = {
            id: savedMessage.id,
            sender_id: sender_id,
            receiver_id: receiver_id,
            message: message.length > 50 ? message.substring(0, 50) + "..." : message,
            timestamp: savedMessage.created_at || new Date().toISOString(),
            chatId: chatId
          };

          console.log(`🔔 Emitting notification to user_${receiver_id}:`, notification);
          io.to(`user_${receiver_id}`).emit("new_notification", notification);

          console.log("✅ Message emitted and published");

        } catch (err) {
          console.error("❌ Error send_message:", err);
          socket.emit("error", { error: err.message });
        }
      });

      // KHÔNG CẦN socket handler "emit_bot_response" nữa
      // Bot response được emit trực tiếp từ controller qua chatGateway.emitBotResponse()

      socket.on("disconnect", () => {
        console.log(`❎ User disconnected: ${socket.id}`);
      });
    });

    console.log("✅ ChatGateway initialized");
  },

  // Helper method để emit bot response từ controller
  emitBotResponse: (chatId, botMessage) => {
    if (!io) {
      console.error("❌ Socket.io not initialized!");
      return;
    }

    const messageWithChatId = {
      ...botMessage,
      chatId: chatId
    };

    console.log("🤖 Backend emitting bot response to room:", chatId);
    console.log("� ChatId type:", typeof chatId);
    console.log("📢 Bot message:", messageWithChatId);
    console.log("�📢 Bot message chatId:", messageWithChatId.chatId, "type:", typeof messageWithChatId.chatId);

    // Emit tới tất cả users trong room
    io.to(chatId).emit("receive_message", messageWithChatId);

    // Publish để sync với các server instances khác
    redis.publish("chat_messages", JSON.stringify(messageWithChatId));

    // Emit notification tới receiver (bot response)
    const [senderId, receiverId] = chatId.split('_');
    const notification = {
      id: botMessage.id,
      sender_id: botMessage.sender_id,
      receiver_id: receiverId,
      message: botMessage.message.length > 50
        ? botMessage.message.substring(0, 50) + "..."
        : botMessage.message,
      timestamp: botMessage.created_at || new Date().toISOString(),
      chatId: chatId
    };

    console.log(`🔔 Emitting bot notification to user_${receiverId}:`, notification);
    io.to(`user_${receiverId}`).emit("new_notification", notification);

    console.log("✅ Bot response emitted and published");
  }
};

module.exports = chatGateway;