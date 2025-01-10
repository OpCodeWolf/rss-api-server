import * as express from 'express';

declare global {
    namespace Express {
        interface Request {
            session?: {
                userId?: number; // Assuming userId is a number
                userLevel?: UserLevel; // Assuming UserLevel is defined elsewhere
                // Add other session properties as needed
            };
        }
    }
}
