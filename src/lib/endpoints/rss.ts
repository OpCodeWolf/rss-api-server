import { Request, Response } from 'express';
import { getAllRssItems } from '../database'; // Assuming getAllRssItems exists
import xml2js from 'xml2js';
import { Database } from 'sqlite3';
// import Request from '../../types/express';

const db = new Database('rss.db');

export const getRssFeedHandler = async (req: Request, res: Response) => {
    try {
        const items = await getAllRssItems('desc', 1, 150); // Fetch latest 100 items
        const rssItems = items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.description,
            image: item.image // Include the image in the RSS output
        }));

        // Insert a record into user_downloads table
        // console.log(`SESSION: ${JSON.stringify(req, ()=>{}, 2)}`);
        // let userId = -1; // Default to -1 for anonymous users
        // if (req) {
        //     if (req.session) {

        //     }
        // } else {
        //     console.log(`we should always have a request`);
        // }
        
        // if (req && req.session && req.session.userId) {
        //     // Authenticated session
        //     userId = req.session?.userId; // Use the user ID from the session
        // } else {
        //     // Log a warning for anonymous users
        //     console.warn('Anonymous user detected: No session object found.');
        // }

        // const feedId = 1; // Assuming feed ID is 1 for this example
        // db.run(`INSERT INTO user_downloads (user_id, feed_id) VALUES (?, ?)`, [userId, feedId], (err) => {
        //     if (err) {
        //         console.error('Error inserting into user_downloads:', err); // Log the error
        //     }
        // });

        const rssFeed = {
            rss: {
                $: {
                    version: '2.0',
                    'xmlns:media': 'http://search.yahoo.com/mrss/'
                },
                channel: [
                    {
                        title: process.env.TITLE || 'Default Title', // Use the TITLE from the environment variable or a default
                        link: process.env.SERVER_URL + '/rss', // Use the SERVER_URL from the environment variable
                        description: process.env.DESCRIPTION || 'Default description', // Use the DESCRIPTION from the environment variable or a default
                        item: rssItems.map(item => ({
                            title: item.title,
                            link: item.link,
                            pubDate: item.pubDate,
                            comments: item.link,
                            description: {
                                _: `<a href="${item.link}">Comments</a>`,
                                $: { 'cdata': true }
                            },
                            ...(item.image ? {
                                enclosure: {
                                    $: {
                                        url: item.image,
                                        type: 'image/jpeg'
                                    }
                                },
                                'media:content': {
                                    $: {
                                        url: item.image,
                                        type: 'image/jpeg'
                                    }
                                }
                            } : {})
                        }))
                    }
                ]
            }
        };

        const builder = new xml2js.Builder();
        const xml = builder.buildObject(rssFeed);
        res.header('Content-Type', 'application/rss+xml');
        res.send(xml);
    } catch (error) {
        console.error('Error generating RSS feed:', error); // Log the error
        res.status(500).json({ error: 'Failed to generate RSS feed' });
    }
};
