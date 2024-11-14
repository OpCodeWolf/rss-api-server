import { Request as ExpressRequest } from 'express';
import { UserLevel } from './UserLevel';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    userLevel?: UserLevel;
  }
}
