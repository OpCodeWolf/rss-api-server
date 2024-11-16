import RssServer from './lib/RssServer';
import CronJob from './lib/CronJob';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import cors from 'cors';

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: process.env.TITLE || 'RSS API Server', // Use the TITLE from the environment variable or a default
      version: process.env.VERSION || '1.0.0', // Use the VERSION from the environment variable or a default
      description: process.env.DESCRIPTION || 'API documentation', // Use the DESCRIPTION from the environment variable or a default
    },
    servers: [
      {
        url: process.env.SERVER_URL, // Use the SERVER_URL from the environment variable
      },
    ],
    components: {
      securitySchemes: {
        OAuth2: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Enter your OAuth 2.0 token without any prefix',
        },
      },
    },
    security: [
      {
        OAuth2: [],
      },
    ],
  },
  apis: ['./src/lib/*.ts'], // Path to the API docs
};

// Initialize Swagger JSDoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Create the main instance of the server
const server = new RssServer();

// Enable CORS for all origins
server.app.use(cors()); // Using CORS middleware

// Set up Swagger UI
server.app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Start the cron job
const cronJob = new CronJob(server);
cronJob.start();

// Start the server
server.start();
