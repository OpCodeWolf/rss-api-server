import { Request, Response } from 'express';
import { Database } from 'sqlite3';

const db = new Database('rss.db');

interface TotalFeeds {
    total: number;
}

export const getTotalFeeds = (req: Request, res: Response) => {
    const query = `SELECT COUNT(*) AS total FROM rss_streams;`;

    db.get(query, [], (err, row: TotalFeeds) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Row returned from query:', row); // Log the row for debugging
        res.json({ total: row.total });
    });
};
