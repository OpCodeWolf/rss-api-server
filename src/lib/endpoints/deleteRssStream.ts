import { Request, Response } from 'express';
import { deleteRssStreamById } from '../database';

export const deleteRssStreamHandler = async (req: Request, res: Response) => {
    const { id } = req.params;
    const idNumber = parseInt(id, 10);

    if (isNaN(idNumber)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    try {
        await deleteRssStreamById(idNumber);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete RSS stream' });
    }
};
