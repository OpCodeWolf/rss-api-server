import { Request, Response } from 'express';

export const getRootResponse = (req: Request, res: Response) => {
    res.status(200).json({ 
        version: '2.0.0',
        description: 'This is a personal curated rss news feed server. Content is not editable from outside of the network.',
        status: 'ok'
    });
};
