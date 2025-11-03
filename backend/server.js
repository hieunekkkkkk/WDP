require('dotenv').config({ path: '.env.dev' });
const http = require('http');
const app = require('./app');
const chatGateway = require('./src/gateway/chatGateway');

const logger = require('./src/log/logger');
const PORT = process.env.PORT || 8080;

const httpServer = http.createServer(app); // 3. Tạo một server HTTP từ Express app

// 4. KHỞI TẠO CHAT GATEWAY VÀ GẮN NÓ VÀO SERVER
chatGateway.init(httpServer);


// 5. Thay đổi 'app.listen' thành 'httpServer.listen'
const server = httpServer.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  console.log(`Server is running on port ${PORT}`);
});


// Graceful shutdown (Phần này vẫn giữ nguyên, nó đã đúng vì 'server'
// bây giờ tham chiếu đến httpServer)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});