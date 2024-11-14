import { Request, Response } from 'express';
import { getUserByUsername } from '../database';
import bcrypt from 'bcrypt';

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await getUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // const token = generateValidToken();
        // await saveToken(username, token); // Save the new token in the database
        res.status(200).json({ "token": user.token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to login' });
    }
};
