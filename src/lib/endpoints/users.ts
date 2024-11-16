import { Request, Response } from 'express';
import { getAllUsers } from '../database'; // Assuming getAllUsers exists

export const getUsersHandler = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1; // Default to page 1
        const pageSize = parseInt(req.query.page_size as string) || 10; // Default to 10 users per page
        const users = await getAllUsers(page, pageSize); // Fetch users with pagination
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
