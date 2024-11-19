import { Request, Response } from 'express';
import { Database } from 'sqlite3';

const db = new Database('rss.db');

interface UserDownloadLog {
    timestamp: string;
    download_count: number;
}

export const getUserDownloadFrequency = (req: Request, res: Response) => {
    const query = `
        SELECT strftime('%Y-%m-%d %H:%M', download_time) AS timestamp, COUNT(*) AS download_count
        FROM user_downloads
        GROUP BY timestamp
        ORDER BY timestamp;
    `;

    db.all(query, [], (err, rows: UserDownloadLog[]) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const timestamps = rows.map(row => row.timestamp);
        const downloadCounts = rows.map(row => row.download_count);
        res.json({ timestamps, downloadCounts });
    });
};
