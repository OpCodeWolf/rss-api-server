import express, { Request as ExpressRequest } from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan'; // Import morgan for logging
import { getUserByToken } from './database';
import session, { Session } from 'express-session';
import { UserLevel } from '../types/UserLevel';
import cors from 'cors'; // Importing the cors package

// Importing endpoint handlers
import { login } from './endpoints/login';
import { logout } from './endpoints/logout';
import { getRootResponse } from './endpoints/root';
import { addRssStreamHandler, getAllRssStreamsHandler } from './endpoints/rssStreams';
import { getAllRssItemsHandler, updateRssItemsHandler, deleteRssItemHandler } from './endpoints/rssItems'; // Importing the DELETE handler
import { deleteRssStreamHandler } from './endpoints/deleteRssStream';
import { updateRssFeedsHandler } from './endpoints/rssUpdateStreams';
import { getRssFeedHandler } from './endpoints/rss';
import { createUserHandler } from './endpoints/createUser';
import { updateUserHandler } from './endpoints/updateUser';
import { encryptHandler } from './endpoints/encrypt';
import { deleteUserHandler } from './endpoints/deleteUser';
import { getUsersHandler } from './endpoints/rss'; // Importing the getUsersHandler

// Extend the Express Request interface to include session
interface Request extends ExpressRequest {
  session: Session & {
    userId?: number; // Keep userId in session
    userLevel?: UserLevel; // Keep userLevel in session
    destroy: (callback: (err?: any) => void) => void;
  };
}

export default class RssServer {
  public app: express.Application; // Changed to public
  public PORT: number;

  constructor() {
    this.app = express();
    this.PORT = Number(process.env.PORT) || 3000;
    this.app.use(cors()); // Using CORS middleware
    this.app.use(bodyParser.json());
    this.app.use(morgan(':date[iso] :method :url :status - :response-time ms - :remote-addr - :user-agent - X-Forwarded-For: :req[x-forwarded-for]')); // Updated logging middleware

    // Middleware for session management
    this.app.use(session({
      secret: 'your_secret_key',
      resave: false,
      saveUninitialized: true,
    }));

    // Token middleware
    this.app.use(this.tokenMiddleware.bind(this));

    // Handle OPTIONS requests for CORS preflight
    this.app.options('*', (req, res) => {
      res.sendStatus(200);
    });

    this.initializeRoutes();
  }

  private tokenMiddleware(req: Request, res: express.Response, next: express.NextFunction) {
    // Allow access to the public endpoints without a token
    if (
      req.path === '/' ||
      req.path === '/rss' ||
      req.path.startsWith('/swagger') ||
      req.path.startsWith('/login')
    ) {
      return next();
    }

    const token = req.headers['authorization'];

    if (!token) {
      return res.status(403).json({ error: 'Forbidden: Invalid or missing token' });
    }

    // Check the token against the database
    getUserByToken(token).then((
      user: { 
        id: number;
        username: string;
        password: string;
        token: string;
        user_level: UserLevel;
      } | null
    ) => {
      if (!user || user.token !== token) {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing token' });
      }

      req.session.userId = user.id;
      req.session.userLevel = <UserLevel>user.user_level || UserLevel.PUBLIC; // Set user level in session

      // Check user level for specific endpoints
      const endpointPermissions: { [key: string]: UserLevel[] } = {
        '/': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss_streams': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss_streams/{id}': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss_update_streams': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss_items': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/rss_items/{id}': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/login': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/logout': [UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/create_user': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/update_user': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/delete_user/{username}': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
        '/encrypt': [UserLevel.ADMIN, UserLevel.SUPERADMIN],
      };

      const requiredLevels = endpointPermissions[req.path];
      if (requiredLevels && !requiredLevels.includes(req.session.userLevel)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient user level' });
      }

      next();
    }).catch(() => {
      return res.status(403).json({ error: 'Forbidden: Invalid or missing token' });
    });

  }

  private initializeRoutes() {

    /**
     * @swagger
     * /:
     *   get:
     *     summary: Get root response
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve root response
     */
    this.app.get('/', getRootResponse); // Updated root endpoint

    /**
     * @swagger
     * /rss:
     *   get:
     *     summary: Get RSS feed
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to generate RSS feed
     */
    this.app.get('/rss', getRssFeedHandler); // Updated RSS endpoint

    /**
     * @swagger
     * /rss_streams:
     *   get:
     *     summary: Get all RSS streams
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve RSS streams
     */
    this.app.get('/rss_streams', getAllRssStreamsHandler); // Updated get all RSS streams endpoint

    /**
     * @swagger
     * /rss_streams:
     *   post:
     *     summary: Add an RSS stream
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               link:
     *                 type: string
     *     responses:
     *       201:
     *         description: RSS stream added successfully
     *       400:
     *         description: Link is required
     *       500:
     *         description: Failed to add RSS stream
     */
    this.app.post('/rss_streams', addRssStreamHandler); // Updated add RSS stream endpoint

    /**
     * @swagger
     * /rss_streams/{id}:
     *   delete:
     *     summary: Delete an RSS stream by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the RSS stream to delete
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: RSS stream deleted successfully
     *       400:
     *         description: Invalid ID
     *       500:
     *         description: Failed to delete RSS stream
     */
    this.app.delete('/rss_streams/:id', deleteRssStreamHandler); // Updated delete RSS stream endpoint

    /**
     * @swagger
     * /rss_update_streams:
     *   post:
     *     summary: Update RSS feeds
     *     responses:
     *       200:
     *         description: RSS feeds updated successfully
     *       500:
     *         description: Failed to update RSS feeds
     */
    this.app.post('/rss_update_streams', updateRssFeedsHandler); // Updated update RSS feeds endpoint

    /**
     * @swagger
     * /rss_items:
     *   get:
     *     summary: Get all RSS items
     *     parameters:
     *       - name: pubDateOrder
     *         in: query
     *         required: false
     *         description: Order of publication date
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number
     *         schema:
     *           type: integer
     *       - name: page_size
     *         in: query
     *         required: false
     *         description: Number of items per page
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve RSS items
     */
    this.app.get('/rss_items', getAllRssItemsHandler); // Updated get all RSS items endpoint

    /**
     * @swagger
     * /rss_items/{id}:
     *   delete:
     *     summary: Delete an RSS item by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the RSS item to delete
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: RSS item deleted successfully
     *       500:
     *         description: Failed to delete RSS item
     */
     this.app.delete('/rss_items/:id', deleteRssItemHandler);
     
    /**
     * @swagger
     * /rss_items:
     *   post:
     *     summary: Update RSS items
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             oneOf:
     *               - type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   title:
     *                     type: string
     *                   description:
     *                     type: string
     *                   link:
     *                     type: string
     *                   pubDate:
     *                     type: string
     *               - type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     title:
     *                       type: string
     *                     description:
     *                       type: string
     *                     link:
     *                       type: string
     *                     pubDate:
     *                       type: string
     *     responses:
     *       200:
     *         description: RSS items updated successfully
     *       400:
     *         description: Invalid input
     *       500:
     *         description: Failed to update RSS items
     */
    this.app.post('/rss_items', updateRssItemsHandler); // Updated update RSS items endpoint

    /**
     * @swagger
     * /login:
     *   post:
     *     summary: User login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful login
     *       400:
     *         description: Username and password are required
     *       401:
     *         description: Invalid username or password
     *       500:
     *         description: Failed to login
     */
     this.app.post('/login', login); // Updated login endpoint

    /**
     * @swagger
     * /logout:
     *   post:
     *     summary: User logout
     *     responses:
     *       200:
     *         description: Successful logout
     *       500:
     *         description: Failed to logout
     */
    this.app.post('/logout', logout); // Updated logout endpoint
    
    /**
     * @swagger
     * /create_user:
     *   post:
     *     summary: Create a new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       201:
     *         description: User created successfully
     *       400:
     *         description: Username and password are required
     *       409:
     *         description: Username already exists
     *       500:
     *         description: Failed to create user
     */
    this.app.post('/create_user', createUserHandler); // Updated create user endpoint

    /**
     * @swagger
     * /update_user:
     *   post:
     *     summary: Allows an admin to update a users account
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *               token:
     *                 type: string
     *               user_level:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful update
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Input user object is required
     */
    this.app.post('/update_user', updateUserHandler); // Updated update user endpoint

    /**
     * @swagger
     * /delete_user/{username}:
     *   delete:
     *     summary: Delete a user by username
     *     parameters:
     *       - name: username
     *         in: path
     *         required: true
     *         description: Username of the user to delete
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: User deleted successfully
     *       404:
     *         description: User not found
     *       500:
     *         description: Failed to delete user
     */
    this.app.delete('/delete_user/:username', deleteUserHandler);


    /**
     * @swagger
     * /encrypt:
     *   post:
     *     summary: Encrypt a string using bcrypt
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               input:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful encryption
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 hash:
     *                   type: string
     *       400:
     *         description: Input string is required
     */
    this.app.post('/encrypt', encryptHandler); // Updated encrypt endpoint

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: List all users with pagination
     *     parameters:
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number for pagination
     *         schema:
     *           type: integer
     *           default: 1
     *       - name: page_size
     *         in: query
     *         required: false
     *         description: Number of users per page
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: Successful response with user data
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   username:
     *                     type: string
     *                   user_level:
     *                     type: string
     *       500:
     *         description: Failed to fetch users
     */
    this.app.get('/users', getUsersHandler); // Register the /users route
  }

  public start() {
    this.app.listen(this.PORT, () => {
      console.log(`Server is running on port ${this.PORT}`);
    });
  }

}
