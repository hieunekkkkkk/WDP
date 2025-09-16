const promClient = require('prom-client');

// Tạo registry để quản lý metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Counter cho số lượng request
const httpRequestCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

// Gauge cho thời gian phản hồi
const responseTimeGauge = new promClient.Gauge({
    name: 'http_response_time_seconds',
    help: 'Response time of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    registers: [register],
});

// Middleware để thu thập metrics
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        httpRequestCounter.inc({
            method: req.method,
            route: req.path,
            status: res.statusCode,
        });
        responseTimeGauge.set(
            { method: req.method, route: req.path },
            duration
        );
    });
    next();
};

// Hàm để xuất metrics qua endpoint /metrics
const metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports = { metricsMiddleware, metricsEndpoint };