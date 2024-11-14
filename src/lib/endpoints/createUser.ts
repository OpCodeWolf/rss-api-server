import { Request, Response } from 'express';
import { createUser } from '../database';
import bcrypt from 'bcrypt';
import { UserLevel } from '../../types/UserLevel'; // Updated import path

export const createUserHandler = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, hashedPassword, UserLevel.USER);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' }); // Change this later as this should not be shown to the public
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};
