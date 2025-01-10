import { Request, Response } from 'express';
import { updateUserLevel, updateUserPassword, updateUserToken, getUserByUsername, getUserByToken } from '../database';
import { pbkdf2, randomBytes } from 'crypto';

export const updateUserHandler = async (req: Request, res: Response) => {
    const { username, password, new_password, verify_password, token, user_level } = req.body;

    // These will be set if validation pass.
    let set_password = null;
    let set_token = null;
    let set_level = null;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    /**
     * Request Validation:
     */

    try {
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

        const ErrorInvalidToken = "Invalid token provided, please try again with a valid token.";
        if (token && token !== existingUser.token) {
            // TODO: Validate that the token is in the right format, length, etc.
            // Valid tokens should look like this: c689b78d-73b4-47d2-80bd-456166c384ea with a length of 36 (this can be changed later)
            const validToken = true;
            if (!validToken) {
                return res.status(400).json({ error: ErrorInvalidToken });
            }
    
            // Check if this token is in use by another user
            const tokenAlreadyExists = await getUserByToken(token);
            if (tokenAlreadyExists) {
                // The token is in use by another user, but we don't want to give that away for security reasons.
                return res.status(400).json({ error: ErrorInvalidToken });
            }
    
            // Otherwise, token is valid
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

        /**
         * Valid Request:
         * Update what needs to be updated.
         */

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
