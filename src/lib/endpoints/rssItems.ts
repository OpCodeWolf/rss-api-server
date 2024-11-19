import { Request, Response } from 'express';
import { getAllRssItems, updateRssItemInDatabase, getTotalRssItemsCount, deleteRssItemById } from '../database';

export const getAllRssItemsHandler = async (req: Request, res: Response) => {
    const { pubDateOrder = 'asc', page = '1', page_size = '20' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(page_size as string, 10);
    
    if (pubDateOrder !== 'asc' && pubDateOrder !== 'desc') {
        return res.status(400).json({ error: 'Invalid pubDateOrder. Use "asc" or "desc".' });
    }

    if (isNaN(pageNumber) || pageNumber < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ error: 'Invalid pagination parameters.' });
    }

    try {
        const items = await getAllRssItems(pubDateOrder, pageNumber, pageSize);
        const totalItems = await getTotalRssItemsCount();
        const totalPages = Math.ceil(totalItems / pageSize);

        res.status(200).json({
            items: items.map(item => ({
                id: item.id,
                link: item.link,
                title: item.title,
                description: item.description,
                pubDate: item.pubDate,
                image: item.image,
                deleted: item.deleted
            })),
            page: pageNumber,
            total_pages: totalPages
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve RSS items' });
    }
};

export const updateRssItemsHandler = async (req: Request, res: Response) => {
    const rssItems = req.body;

    try {
        if (Array.isArray(rssItems)) {
            // Handle multiple RSS items
            for (const item of rssItems) {
                await updateRssItem(item);
            }
        } else if (typeof rssItems === 'object') {
            // Handle a single RSS item
            await updateRssItem(rssItems);
        } else {
            return res.status(400).json({ error: 'Invalid input. Must be an object or an array of objects.' });
        }

        res.status(200).json({ message: 'RSS items updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update RSS items' });
    }
};

const updateRssItem = async (item: any) => {
    const { id, title, description, link, pubDate, image, deleted } = item;

    if (!id) {
        throw new Error('ID is required to update an RSS item');
    }

    // Call the database function to update the RSS item
    await updateRssItemInDatabase(id, { title, description, link, pubDate, image, deleted });
};

// New DELETE handler for /rss_items/:id
export const deleteRssItemHandler = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID is required to delete an RSS item' });
    }

    try {
        await deleteRssItemById(Number(id));
        res.status(200).json({
            "message": "RSS item deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete RSS item' });
    }
};

// New handler for counting RSS items
export const getRssItemsCountHandler = async (req: Request, res: Response) => {
    try {
        const count = await getTotalRssItemsCount();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve RSS items count' });
    }
};
