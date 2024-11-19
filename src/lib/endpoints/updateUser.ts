import { Request, Response } from 'express';
import { updateUserLevel, updateUserPassword, updateUserToken, getUserByUsername, getUserByToken } from '../database';
import { pbkdf2, randomBytes } from 'crypto';

export const updateUserHandler = async (req: Request, res: Response) => {
    const { username, password, new_password, verify_password, token, user_level } = req.body;
    let set_password = null;
    let set_token = null;
    let set_level = null;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Check if the username already exists
    const existingUser = await getUserByUsername(username);
    if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
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
        // Check if the token already exists for another user
        const userWithToken = await getUserByToken(token);
        if (userWithToken && userWithToken.username !== username) {
            return res.status(400).json({ error: 'Token already in use by another user' });
        }
        set_token = token;
    } 

    if (user_level) {
        set_level = user_level.toLowerCase();
        // Validate user level against accepted levels
        const validUserLevels = ['admin', 'user', 'superadmin', 'public']; // Example levels
        if (!validUserLevels.includes(set_level)) {
            return res.status(400).json({ error: 'Invalid user level' });
        }
    }

    try {
        if (set_level !== null) {
            await updateUserLevel(username, set_level);
        }
        
        if (set_password !== null) {
            const salt = randomBytes(16).toString('hex'); // Generate a new salt
            pbkdf2(set_password, salt, 100000, 64, 'sha512', async (err, derivedKey) => {
                if (err) throw err;
                const hash = `${salt}$${derivedKey.toString('hex')}`; // Store salt and hash together
                await updateUserPassword(username, hash);
            });
        }
        
        if (set_token !== null) {
            await updateUserToken(username, set_token);
        }

        res.status(200).json({ 
            message: "User updated successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to update user',
            message: error        
        });
    }
};
