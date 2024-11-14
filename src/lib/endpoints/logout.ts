import { Request, Response } from 'express';

export const logout = (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
};
