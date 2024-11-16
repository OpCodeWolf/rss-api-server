import { Request, Response } from 'express';

export const getRootResponse = (req: Request, res: Response) => {
    res.status(200).json({ 
        version: process.env.VERSION || '1.0.0', // Use the VERSION from the environment variable or a default
        description: process.env.DESCRIPTION || 'Default description', // Use the DESCRIPTION from the environment variable or a default
        status: 'ok'
    });
};
