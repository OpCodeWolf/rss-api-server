import { Request, Response } from 'express';
import { getUserByUsername } from '../database';
import { pbkdf2, randomBytes } from 'crypto';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const hash = user.password; // Assuming the stored password is the hash
        const salt = hash.split('$')[0]; // Extracting the salt from the stored hash
        pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
            if (err) throw err;
            if (derivedKey.toString('hex') !== hash.split('$')[1]) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            res.status(200).json({ 
                "token": user.token,
                "level": user.user_level 
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to login' });
    }
};
