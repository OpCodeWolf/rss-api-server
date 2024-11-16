import { Request, Response } from 'express';
import * as databasae from '../database';
import { UserLevel } from '../../types/UserLevel'; // Updated import path
import { User } from '../../types/User';

export const createUserHandler = async (req: Request, res: Response): Promise<any> => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Create the user
        const user = await databasae.createUser(username, password, UserLevel.USER);

        res.status(201).json({ 
            message: 'User created successfully',
            token: user.token
        });
    } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username already exists' }); // Change this later as this should not be shown to the public
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};
