import { Request, Response } from 'express';
import { Database } from 'sqlite3';

const db = new Database('rss.db');

interface FeedAccessLog {
    timestamp: string;
    access_count: number;
}

export const getFeedPullFrequency = (req: Request, res: Response) => {
    const query = `
        SELECT access_time AS timestamp, SUM(access_count) AS access_count
        FROM feed_access_logs
        GROUP BY access_time
        ORDER BY access_time;
    `;

    db.all(query, [], (err, rows: FeedAccessLog[]) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const timestamps = rows.map(row => row.timestamp);
        const accessCounts = rows.map(row => row.access_count);
        res.json({ timestamps, accessCounts });
    });
};
