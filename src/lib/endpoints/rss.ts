import { Request, Response } from 'express';
import { getAllRssItems } from '../database';
import xml2js from 'xml2js';

export const getRssFeedHandler = async (req: Request, res: Response) => {
    try {
        const items = await getAllRssItems('desc', 1, 100); // Fetch latest 100 items
        const rssItems = items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.description,
            image: item.image // Include the image in the RSS output
        }));

        const rssFeed = {
            rss: {
                $: {
                    version: '2.0',
                    'xmlns:media': 'http://search.yahoo.com/mrss/'
                },
                channel: [
                    {
                        title: 'Latest',
                        link: 'https://localhost:3000/rss',
                        description: 'The latest news from around the world.',
                        item: rssItems.map(item => ({
                            title: item.title,
                            link: item.link,
                            pubDate: item.pubDate,
                            comments: item.link,
                            description: {
                                _: `<a href="${item.link}">Comments</a>`,
                                $: { 'cdata': true }
                            },
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
        res.status(500).json({ error: 'Failed to generate RSS feed' });
    }
};
