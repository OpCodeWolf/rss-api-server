import { Request, Response } from 'express';
import { pbkdf2, randomBytes } from 'crypto';

export const encryptHandler = async (req: Request, res: Response) => {
    const { input } = req.body;

    if (!input) {
        return res.status(400).json({ error: 'Input string is required' });
    }

    try {
        const salt = randomBytes(16).toString('hex'); // Generate a new salt
        pbkdf2(input, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) throw err;
            const hash = `${salt}$${derivedKey.toString('hex')}`; // Store salt and hash together
            res.status(200).json({ hash });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to encrypt string' });
    }
};
