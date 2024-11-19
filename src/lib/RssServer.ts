import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
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
import { getUsersHandler } from './endpoints/users';
import { getOpmlHandler } from './endpoints/opml';
import { getUserDownloadFrequency } from './endpoints/userDownloadFrequency';
import { getTotalFeeds } from './endpoints/totalFeeds';
import { getFeedPullFrequency } from './endpoints/feedPullFrequency';

// Importing initializeRoutes from routes
import { initializeRoutes } from './routes';

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
    this.app.use((req: ExpressRequest, res: Response, next: NextFunction) => {
      // Allow access to the public endpoints without a token
      if (
        req.path === '/' ||
        req.path ===  '/opml' ||
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

        const userLevel = <UserLevel>user.user_level || UserLevel.PUBLIC; // Set user level in session

        // Check user level for specific endpoints
        const endpointPermissions: { [key: string]: UserLevel[] } = {
          '/': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
          '/opml': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
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
          '/feed-pull-frequency': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
          '/total-feeds': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
          '/user-download-frequency': [UserLevel.PUBLIC, UserLevel.USER, UserLevel.ADMIN, UserLevel.SUPERADMIN],
        };

        const requiredLevels = endpointPermissions[req.path];
        if (requiredLevels && !requiredLevels.includes(userLevel)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient user level' });
        }

        next();
      }).catch(() => {
        return res.status(403).json({ error: 'Forbidden: Invalid or missing token' });
      });
    });

    // Handle OPTIONS requests for CORS preflight
    this.app.options('*', (req, res) => {
      res.sendStatus(200);
    });

    // Call initializeRoutes with the app instance
    initializeRoutes.call(this, this.app);
  }

  public start() {
    this.app.listen(this.PORT, () => {
      console.log(`Server is running on port ${this.PORT}`);
    });
  }

}
