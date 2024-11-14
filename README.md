# RSS-API-Server

This RSS-API-Server is a Node.js-based API server built with TypeScript. It provides various endpoints for managing RSS feeds and user authentication, utilizing SQLite for data storage. The server is designed to be lightweight and efficient, making it suitable for integration with various applications.

## Installation
To install the project, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/OpCodeWolf/rss-api-server
   cd rss-api-server
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

## Starting the Project
To start the project locally, run:
```bash
npm start
```
This command will build the TypeScript code and start the server.

Once every hour on the hour, all of the RSS feeds will auto-update. This can be changed in the CronJob.ts file.

## Testing
> The tests are currently broken, but I will be fixing them soon.

To run the tests for the project, use the following command:
```bash
npm test
```
This will build the project and execute the tests using Jest.

## Deployment as a Docker Container
To deploy the project as a Docker container, follow these steps:

1. Build the Docker image:
   ```bash
   npm build
   ```

2. Start the container:
   ```bash
   docker-compose up -d
   ```

The server will be accessible at `http://localhost:3000`.

### Environment Variables
You can set environment variables in the `docker-compose.yml` file as needed. The `NODE_ENV` variable is set to `production` by default.

## Logging In with the Default Admin User
>Please note that you can change the password and token with the API once authenticated.

To log in with the default admin user account and obtain a token, use the following credentials:

- **Username**: `admin`
- **Password**: `admin123`

Send a POST request to the login endpoint (e.g., `http://localhost:3000/login`) with the following JSON body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

If the login is successful, you will receive a token in the response, which can be used for authenticated requests.

## Using the Token in Authenticated Requests
Once you have obtained the token from the login response, you can use it to make authenticated requests to protected endpoints. 

To include the token in your requests, add it to the `Authorization` header as follows:

```
Authorization: Bearer <your_token>
```

### Example of an Authenticated Request
Here is an example of how to make an authenticated request to a protected endpoint (e.g., getting the RSS streams listing):

```bash
curl -X GET http://localhost:3000/rss-streams \
-H "Authorization: <your_token>"
```

Replace `<your_token>` with the actual token you received from the login response. If the token is valid, you will receive the requested data.

## Swagger Documentation
The API is documented using Swagger. You can view the documentation by navigating to the following URL in your browser once the server is running:

```
http://localhost:3000/swagger
```

This will provide you with an interactive interface to explore the available endpoints and their details.