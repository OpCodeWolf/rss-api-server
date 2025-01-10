import * as express from 'express';

declare global {
    namespace Express {
        // TODO: Make this compatible with Redis
        interface Request {
            session?: {
                userId?: number; // Assuming userId is a number
                userLevel?: UserLevel; // Assuming UserLevel is defined elsewhere
                // Add other session properties as needed
            };
        }
    }
}
