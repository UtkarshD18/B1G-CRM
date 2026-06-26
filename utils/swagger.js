const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'B1GCRM API',
      version: '1.0.0',
      description: 'Enterprise API Documentation for B1GCRM',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'], // Expose and generate from JSDoc
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = setupSwagger;
