import { Request, Response } from 'express';
import { addRssStream, getAllRssStreams } from '../database';

export const addRssStreamHandler = async (req: Request, res: Response) => {
    const { link } = req.body;

    if (!link) {
        return res.status(400).json({ error: 'Link is required' });
    }

    try {
        const id = await addRssStream(link);
        res.status(201).json({ 
            message: 'RSS stream added successfully',
            id: id
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add RSS stream' });
    }
};

export const getAllRssStreamsHandler = async (req: Request, res: Response) => {
    try {
        const streams = await getAllRssStreams();
        res.status(200).json(streams.map(stream => ({
            id: stream.id,
            link: stream.link,
            title: stream.title,
            description: stream.description
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve RSS streams' });
    }
};
