import { Request, Response } from 'express';
import { updateUserLevel, updateUserPassword, updateUserToken } from '../database';
import bcrypt from 'bcrypt';

export const updateUserHandler = async (req: Request, res: Response) => {
    const { username, password, new_password, verify_password, token, user_level } = req.body;
    let set_password = null;
    let set_token = null;
    let set_level = null;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Check if the password is being updated
    if (password) {
        // Verify that all information was provided.
        if (!new_password || !verify_password) {
            return res.status(400).json({ error: 'The new_password and verify_password parameters are required to change the password' });
        }
        if (new_password === verify_password) {
            set_password = new_password;
        }
    }

    if (token) {
        set_token = token; // Do some validation here in the future to prevent possible SQL injection
    } 

    if (user_level) {
        set_level = user_level;
        set_level = set_level.toLowerCase(); // Do some validation here in the future to prevent possible SQL injection
    }

    try {
        if (set_level) {
            await updateUserLevel(username, set_level);
        }
        
        if (set_password) {
            const hash = await bcrypt.hash(set_password, 10);
            await updateUserPassword(username, hash);
        }
        
        if (set_token) {
            await updateUserToken(username, set_token);
        }

        res.status(200).json({ 
            message: "User updated successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};
