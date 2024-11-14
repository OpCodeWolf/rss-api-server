import RssServer from './lib/RssServer';
import CronJob from './lib/CronJob';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import cors from 'cors'; // Importing the cors package

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for the project',
    },
    servers: [
      {
        url: 'https://localhost:3000', // Update this URL based on your server configuration
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
