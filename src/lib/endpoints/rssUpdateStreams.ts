import { Request, Response } from 'express';
import { getAllRssStreams, deleteOldRssItems, insertRssItem, getRssItem, getAllFilterItems, rssItemLinkExists } from '../database';
import axios from 'axios';
import xml2js from 'xml2js';
import * as cheerio from 'cheerio';

export const updateRssFeedsHandler = async (req: Request, res: Response) => {

    let filterItems = await getAllFilterItems(0,999999999);

    try {
        // TODO: Make this configurable in a new settings API
        // Calculate the date one month ago
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // TODO: Also make verbosity of log output configurable in the Settings API.
        console.log('Cleaning up old feed items..');

        // Delete old RSS items
        await deleteOldRssItems(oneMonthAgo);

        console.log('Completed cleaning up old feed items.');

        const streams = await getAllRssStreams();
        if (streams.length === 0) {
            return res.status(400).json({ error: 'No feed links found in the database' });
        }

        // TODO: Break this apart into multiple methods
        for (const stream of streams) {
            console.log(`Updating RSS Stream: ${stream.link}`);
            const response = await axios.get(stream.link);
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(String(response.data));
            const items = result.rss.channel[0].item;

            for (const item of items) {

                let rejectionFound = false;

                for (let filterItem of filterItems) {
                    if (String(item.link).includes(filterItem.filter)) {
                        rejectionFound = true;
                    }
     
                    // Also apply any regex filters
                    if (filterItem.filter.startsWith('regex:')) {
                        if (isValidRegex(filterItem.filter)) {
                            const regex = new RegExp(filterItem.filter.replace('regex:',''));
                            if (regex.test(item.link)) {
                                rejectionFound = true;
                            }
                        }
                    }
                }
            
                if (rejectionFound) {
                    // TODO: Add to a filtered item list for review in the UI.
                    console.log(`Filtered item: ${JSON.stringify(item)}`);
                    continue;
                }

                // TODO: There might be an update or retraction and item
                // may need to be updated. Check RSS spec on how to do this.
                if (!await rssItemLinkExists(item.link)) {

                    const description = Array.isArray(item.description) ? item.description[0] : '';
                    let imageUrl = '';
                    if (item.image) {
                        imageUrl = item.image;
                    }

                    imageUrl = await fetchImageUrl(item.link); // Fetch the image URL from the page

                    const rssItem = {
                        link: Array.isArray(item.link) ? item.link[0] : '',
                        title: Array.isArray(item.title) ? item.title[0] : '',
                        description: description,
                        pubDate: Array.isArray(item.pubDate) ? item.pubDate[0] : '',
                        dateTime: formatDate(new Date().toISOString()), // Created date for this item in the DB
                        image: imageUrl || ''// Add the extracted image URL
                    };

                    await insertRssItem(rssItem);
                }
            }
        }
        console.log('RSS streams updated successfully');
        res.status(200).json({ message: 'RSS streams updated successfully' });
    } catch (error) {
        res.status(500).json({ error: `Failed to update RSS streams: ${error}` });
    }
};

// TODO: Left off here.. allow a one off request to refresh a specific feed item.
// Endpoint and UI functionality has been implemented already.
const refreshRssItem = async (link: string): Promise<void> => {

    const itemExists = await rssItemLinkExists(link);

    if (itemExists) {
        const item = await getRssItem(link);

        console.log(`REFRESH ITEM: ${item}`);

    }

}

const fetchImageUrl = async (link: string): Promise<string> => {
    
    if (!link) {
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

            // TODO: not sure if this is spec?
            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('meta[property="og:image:url"]').attr('content');
            }

            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('meta[property="twitter:image"]').attr('content');
            }

            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('meta[name="twitter:image"]').attr('content');
            }

            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('meta[property="twitter:imageUrl"]').attr('content');
            }

            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('//header/div[@class="inner"]/a[@class="image avatar"]/img"]').attr('src');
            }

            if (imageUrl === null || imageUrl === '' || imageUrl === undefined) {
                imageUrl = $('//div[contains(@class,"article-issue-img")]/img').attr('src');
            }

            if (imageUrl === null || imageUrl?.endsWith('missing.png') || imageUrl?.startsWith('blob') || imageUrl?.startsWith('data:image')) {
                imageUrl = '';
            }
        }

        // If the image url starts with a slash, then we have to extract the article domain and concatenate with the image url
        if (imageUrl?.startsWith('/') || imageUrl?.startsWith('../')) {
            const url = new URL(link);
            imageUrl = `${url.protocol}://${url.hostname}${imageUrl.replace('..','')}`;
        }

        return imageUrl || ''; // Return the image URL or an empty string if not found
    } catch (error) {
        return ''; // Return an empty string in case of an error
    }
};

// TODO: Move to a Utils class
const convertDate = (isoDateString: string): string => {
    const date = new Date(isoDateString);

    const day = date.toUTCString().split(",")[0]; // Get the day of the week
    const dayNumber = date.getUTCDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    const timezone = "+0000"; // UTC timezone

    // DateTime Format = YYYY-MM-DD hh:mm:ss
    return `${year}-${day}, ${dayNumber} ${month} ${hours}:${minutes}:${seconds} ${timezone}`;
};

// TODO: Move to a Utils class
function formatDate(isoDateString: string): string {
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// TODO: Move to a Utils class
function isValidRegex(regexString: string): boolean {
    try {
      new RegExp(regexString);
      return true;
    } catch (e) {
      return false;
    }
}