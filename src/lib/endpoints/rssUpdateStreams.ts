import { Request, Response } from 'express';
import { getAllRssStreams, deleteOldRssItems, insertRssItem } from '../database';
import axios from 'axios';
import xml2js from 'xml2js';
import * as cheerio from 'cheerio';

export const updateRssFeedsHandler = async (req: Request, res: Response) => {
    try {
        // Calculate the date one month ago
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Delete old RSS items
        await deleteOldRssItems(oneMonthAgo);

        const streams = await getAllRssStreams();
        if (streams.length === 0) {
            return res.status(400).json({ error: 'No feed links found in the database' });
        }

        for (const stream of streams) {
            const response = await axios.get(stream.link);
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(String(response.data));
            const items = result.rss.channel[0].item;

            for (const item of items) {
                const description = Array.isArray(item.description) ? item.description[0] : '';
                let imageUrl = '';
                if (!item.image) {
                    imageUrl = await fetchImageUrl(item.link); // Fetching the image URL from the page
                } else {
                    imageUrl = item.image;
                }
                const rssItem = {
                    link: Array.isArray(item.link) ? item.link[0] : '',
                    title: Array.isArray(item.title) ? item.title[0] : '',
                    description: description,
                    pubDate: Array.isArray(item.pubDate) ? item.pubDate[0] : '',
                    dateTime: new Date().toISOString(),
                    image: imageUrl // Add the extracted image URL
                };
                await insertRssItem(rssItem);
            }
        }
        res.status(200).json({ message: 'RSS streams updated successfully' });
    } catch (error) {
        res.status(500).json({ error: `Failed to update RSS streams: ${error}` });
    }
};

const fetchImageUrl = async (link: string): Promise<string> => {
    const rejectedUrlTypes: string[] = [
        '.pdf', '.exe', '.gif', '.jpg', '.jpeg', '.mpg', '.mp4', '.mp3', '.js', '.xml'
    ];
    const rejectedContains: string[] = [
        'google.com',
        'github.com',
        'github.io',
        'kit.edu',
        'iotify.help',
        '.mobi',
        '.website',
    ];
    if (!link) {
        return '';
    }
    let rejectionFound = false;

    for (let item of rejectedUrlTypes) {
        if (String(link).endsWith(item)) {
            rejectionFound = true;
        }
    }

    for (let item of rejectedContains) {
        if (String(link).includes(item)) {
            rejectionFound = true;
        }
    }

    if (rejectionFound) {
        return '';     
    }
    try {
        const response = await axios.get(link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125 (RSS Verification Bot)',
                'Accept': 'text/html',
                'Connection': 'close'
            }
        });

        if (response.status >= 400) {
            return '';
        }

        let imageUrl = null;
        if (response && response.data) {
            const $ = cheerio.load(String(response.data));
            imageUrl = $('meta[property="og:image"]').attr('content');

            if (!imageUrl) {
                imageUrl = $('meta[property="twitter:image"]').attr('content');
            }
        }
        // If the image url starts with a slash, then we have to extract the article domain and concatenate them
        if (imageUrl?.startsWith('/')) {
            const url = new URL(link);
            imageUrl = `${url.protocol}://${url.host}${link}`;
        }

        return imageUrl || ''; // Return the image URL or an empty string if not found
    } catch (error) {
        return ''; // Return an empty string in case of an error
    }
};
