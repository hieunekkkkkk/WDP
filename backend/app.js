const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const router = require('./src/routes/index');
const adminRoutes = require('./src/routes/admin');
const logger = require('./src/log/logger');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger/swaggerConfig');
const { metricsMiddleware, metricsEndpoint } = require('./src/middleware/metrics');


const app = express();

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    req.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    res.setHeader('X-Request-ID', req.id);

    // Log incoming request
    logger.info('Incoming request', {
        requestId: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
            requestId: req.id,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });

    next();
});

// Metrics endpoint - đặt trước CORS để Prometheus có thể truy cập
app.get('/metrics', metricsEndpoint);



// Metrics middleware
app.use(metricsMiddleware);

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://smearch.io.vn',
        'http://smearch.io.vn',  // Nếu chưa có SSL
        'http://react-app:5173',  // Docker container name
        'http://frontend-react-app-1:5173'  // Docker compose service name
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '1gb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// // Metrics endpoint - không áp dụng CORS để Prometheus có thể truy cập
// app.get('/metrics', (req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// }, metricsEndpoint);

// Connect to MongoDB
connectDB();


// Routes
app.use('/api', router);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        requestId: req.id,
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            requestId: req.id
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    logger.warn('Route not found', {
        requestId: req.id,
        url: req.url,
        method: req.method
    });

    res.status(404).json({
        error: {
            message: 'Route not found',
            requestId: req.id
        }
    });
});

module.exports = app;