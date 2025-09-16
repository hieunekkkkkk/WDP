const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev' });
const PORT = process.env.PORT;


const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'LocalLink API',
        version: '1.0.0',
        description: 'API for LocalLink website',
    },
    servers: [
        {
            url: `http://localhost:${PORT}`,
            description: 'Local server',
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;