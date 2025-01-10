import { Request, Response } from 'express';
import { getAllFilterItems, updateOrAddFilterItemInDatabase, getTotalFilterItemsCount, deleteFilterItemById, addFilterItem } from '../database';

export const getAllFilterItemsHandler = async (req: Request, res: Response) => {
    const { page = '1', page_size = '20' } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(page_size as string, 10);
    
    if (isNaN(pageNumber) || pageNumber < 1 || isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ error: 'Invalid pagination parameters.' });
    }

    try {
        const items = await getAllFilterItems(pageNumber, pageSize);
        if (items.length>0) {

            const totalItems = await getTotalFilterItemsCount();
            const totalPages = Math.ceil(totalItems / pageSize);
    
            res.status(200).json({
                items: items.map((item: { id: any; filter: any; title: any; description: any; dateTime: any; }) => ({
                    id: item.id,
                    filter: item.filter,
                    title: item.title,
                    description: item.description,
                    createdDate: item.dateTime
                })),
                page: pageNumber,
                total_pages: totalPages
            });
        } else {
            const totalPages = 1;
            res.status(200).json({
                items:[],
                page: totalPages,
                total_pages: totalPages
            });
        }
    } catch (error) {
        console.log(`Failed to retrieve filter items: ${error}`);
        res.status(500).json({ error: 'Failed to retrieve filter items' });
    }
};

export const updateFilterItemsHandler = async (req: Request, res: Response) => {
    const filterItems = req.body;

    try {
        if (Array.isArray(filterItems)) {
            // Handle multiple filter items
            for (const item of filterItems) {
                await updateFilterItem(item);
            }
        } else if (typeof filterItems === 'object') {
            // Handle a single filter item
            await updateFilterItem(filterItems);
        } else {
            return res.status(400).json({ error: 'Invalid input. Must be an object or an array of objects.' });
        }

        res.status(200).json({ message: 'Filter item(s) updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update filter item(s)' });
    }
};

export const refreshFilterItemHandler = async (req: Request, res: Response) => {
    const id = req.body;

    try {
        if (id) {
            // await refreshFilterItem();
        } else {
            return res.status(400).json({ error: 'Invalid input. Must contain an id of an item to update.' });
        }

        res.status(200).json({ message: 'Filter items updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update fiter items' });
    }
};

const updateFilterItem = async (item: any) => {
    const { filter, id, title, description } = item;

    if (!filter) {
        throw new Error('A filter is required to update or add an item');
    }

    // Call the database function to update the filter item
    return await updateOrAddFilterItemInDatabase({ filter, id, title, description });
};

// New DELETE handler for /filter_items/:id
export const deleteFilterItemHandler = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID is required to delete a filter item' });
    }

    try {
        await deleteFilterItemById(Number(id));
        res.status(200).json({
            "message": "Filter item deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete Filter item' });
    }
};

// New handler for counting Filter items
export const getFilterItemsCountHandler = async (req: Request, res: Response) => {
    try {
        const count = await getTotalFilterItemsCount();
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve filter items count' });
    }
};
