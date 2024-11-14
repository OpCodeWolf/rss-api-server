import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

export const encryptHandler = async (req: Request, res: Response) => {
    const { input } = req.body;

    if (!input) {
        return res.status(400).json({ error: 'Input string is required' });
    }

    try {
        const hash = await bcrypt.hash(input, 10);
        res.status(200).json({ hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to encrypt string' });
    }
};
