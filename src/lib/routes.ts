import { Request, Response } from 'express';
import { createUserHandler } from './endpoints/createUser';
import { deleteRssStreamHandler } from './endpoints/deleteRssStream';
import { encryptHandler } from './endpoints/encrypt';
import { getFeedPullFrequency } from './endpoints/feedPullFrequency';
import { login } from './endpoints/login';
import { logout } from './endpoints/logout';
import { getOpmlHandler } from './endpoints/opml';
import { getRootResponse } from './endpoints/root';
import { getRssFeedHandler } from './endpoints/rss';
import { getAllRssItemsHandler, refreshRssItemHandler, updateRssItemsHandler, deleteRssItemHandler, getRssItemsCountHandler } from './endpoints/rssItems';
import { addRssStreamHandler, getAllRssStreamsHandler } from './endpoints/rssStreams';
import { updateRssFeedsHandler } from './endpoints/rssUpdateStreams';
import { getTotalFeeds } from './endpoints/totalFeeds';
import { updateUserHandler } from './endpoints/updateUser';
import { getUserDownloadFrequency } from './endpoints/userDownloadFrequency';
import { getUsersHandler } from './endpoints/users';
import { deleteUserHandler } from './endpoints/deleteUser'; 
import { deleteFilterItemHandler, getAllFilterItemsHandler, updateFilterItemsHandler } from './endpoints/filterItems';
import { logHandler } from './endpoints/logHandler';

export function initializeRoutes(app: any) {

    /**
     * @swagger
     * /:
     *   get:
     *     summary: Get root response
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve root response
     */
    app.get('/', getRootResponse); // Updated root endpoint

    /**
     * @swagger
     * /opml:
     *   get:
     *     summary: Get OPML feed list
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to generate OPML feed
     */
    app.get('/opml', getOpmlHandler); // Register the /opml route

    /**
     * @swagger
     * /rss:
     *   get:
     *     summary: Get RSS feed
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to generate RSS feed
     */
    app.get('/rss', getRssFeedHandler); // Updated RSS endpoint

    /**
     * @swagger
     * /rss_streams:
     *   get:
     *     summary: Get all RSS streams
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve RSS streams
     */
    app.get('/rss_streams', getAllRssStreamsHandler); // Updated get all RSS streams endpoint

    /**
     * @swagger
     * /rss_streams:
     *   post:
     *     summary: Add an RSS stream
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               link:
     *                 type: string
     *     responses:
     *       201:
     *         description: RSS stream added successfully
     *       400:
     *         description: Link is required
     *       500:
     *         description: Failed to add RSS stream
     */
    app.post('/rss_streams', addRssStreamHandler); // Updated add RSS stream endpoint

    /**
     * @swagger
     * /rss_streams/{id}:
     *   delete:
     *     summary: Delete an RSS stream by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the RSS stream to delete
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: RSS stream deleted successfully
     *       400:
     *         description: Invalid ID
     *       500:
     *         description: Failed to delete RSS stream
     */
    app.delete('/rss_streams/:id', deleteRssStreamHandler); // Updated delete RSS stream endpoint

    /**
     * @swagger
     * /rss_update_streams:
     *   post:
     *     summary: Update RSS feeds
     *     responses:
     *       200:
     *         description: RSS feeds updated successfully
     *       500:
     *         description: Failed to update RSS feeds
     */
    app.post('/rss_update_streams', updateRssFeedsHandler); // Updated update RSS feeds endpoint

    /**
     * @swagger
     * /rss_items:
     *   get:
     *     summary: Get all RSS items
     *     parameters:
     *       - name: pubDateOrder
     *         in: query
     *         required: false
     *         description: Order of publication date
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number
     *         schema:
     *           type: integer
     *       - name: page_size
     *         in: query
     *         required: false
     *         description: Number of items per page
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve RSS items
     */
    app.get('/rss_items', getAllRssItemsHandler); // Updated get all RSS items endpoint

    /**
     * @swagger
     * /rss_items/{id}/refresh:
     *   delete:
     *     summary: Refresh an RSS item by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the RSS item to refresh
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: RSS item refreshed successfully
     *       500:
     *         description: Failed to refresh RSS item
     */
    app.post('/rss_items/:id/refresh', refreshRssItemHandler);

    /**
     * @swagger
     * /rss_items/{id}:
     *   delete:
     *     summary: Delete an RSS item by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the RSS item to delete
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: RSS item deleted successfully
     *       500:
     *         description: Failed to delete RSS item
     */
     app.delete('/rss_items/:id', deleteRssItemHandler);

    /**
     * @swagger
     * /rss_items:
     *   post:
     *     summary: Update RSS items
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             oneOf:
     *               - type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   title:
     *                     type: string
     *                   description:
     *                     type: string
     *                   link:
     *                     type: string
     *                   pubDate:
     *                     type: string
     *               - type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     title:
     *                       type: string
     *                     description:
     *                       type: string
     *                     link:
     *                       type: string
     *                     pubDate:
     *                       type: string
     *     responses:
     *       200:
     *         description: RSS items updated successfully
     *       400:
     *         description: Invalid input
     *       500:
     *         description: Failed to update RSS items
     */
    app.post('/rss_items', updateRssItemsHandler); // Updated update RSS items endpoint


    /*******************************
     * Filter Items
     *******************************/

    /**
     * @swagger
     * /filter_items:
     *   get:
     *     summary: Get all filter items
     *     parameters:
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number
     *         schema:
     *           type: integer
     *       - name: page_size
     *         in: query
     *         required: false
     *         description: Number of items per page
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful response
     *       500:
     *         description: Failed to retrieve filter items
     */
    app.get('/filter_items', getAllFilterItemsHandler); // Updated get all filter items endpoint

    /**
     * @swagger
     * /filter_items/{id}:
     *   delete:
     *     summary: Delete a filter item by ID
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the filter item to delete
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Filter item deleted successfully
     *       500:
     *         description: Failed to delete filter item
     */
    app.delete('/filter_items/:id', deleteFilterItemHandler);

    /**
     * @swagger
     * /filter_items:
     *   post:
     *     summary: Update filter items
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             oneOf:
     *               - type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   filter:
     *                     type: string
     *                   title:
     *                     type: string
     *                   description:
     *                     type: string
     *               - type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     filter:
     *                       type: string
     *                     title:
     *                       type: string
     *                     description:
     *                       type: string
     *     responses:
     *       200:
     *         description: Filter item(s) updated or added successfully
     *       400:
     *         description: Invalid input
     *       500:
     *         description: Failed to update or add filter item(s)
     */
    app.post('/filter_items', updateFilterItemsHandler); // Updated update or add filter item(s) endpoint


    /*******************************
     * IAM
     *******************************/

    /**
     * @swagger
     * /login:
     *   post:
     *     summary: User login
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful login
     *       400:
     *         description: Username and password are required
     *       401:
     *         description: Invalid username or password
     *       500:
     *         description: Failed to login
     */
    app.post('/login', login); // Updated login endpoint

    /**
     * @swagger
     * /logout:
     *   post:
     *     summary: User logout
     *     responses:
     *       200:
     *         description: Successful logout
     *       500:
     *         description: Failed to logout
     */
    app.post('/logout', logout); // Updated logout endpoint
    
    /**
     * @swagger
     * /create_user:
     *   post:
     *     summary: Create a new user
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       201:
     *         description: User created successfully
     *       400:
     *         description: Username and password are required
     *       409:
     *         description: Username already exists
     *       500:
     *         description: Failed to create user
     */
    app.post('/create_user', createUserHandler); // Updated create user endpoint

    /**
     * @swagger
     * /update_user:
     *   post:
     *     summary: Allows an admin to update a users account
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *               token:
     *                 type: string
     *               user_level:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful update
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Input user object is required
     */
    app.post('/update_user', updateUserHandler); // Updated update user endpoint

    /**
     * @swagger
     * /delete_user/{username}:
     *   delete:
     *     summary: Delete a user by username
     *     parameters:
     *       - name: username
     *         in: path
     *         required: true
     *         description: Username of the user to delete
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: User deleted successfully
     *       404:
     *         description: User not found
     *       500:
     *         description: Failed to delete user
     */
    app.delete('/delete_user/:username', deleteUserHandler);


    /**
     * @swagger
     * /encrypt:
     *   post:
     *     summary: Encrypt a string using pbkdf2
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               input:
     *                 type: string
     *     responses:
     *       200:
     *         description: Successful encryption
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 hash:
     *                   type: string
     *       400:
     *         description: Input string is required
     */
    app.post('/encrypt', encryptHandler);

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: List all users with pagination
     *     parameters:
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number for pagination
     *         schema:
     *           type: integer
     *           default: 1
     *       - name: page_size
     *         in: query
     *         required: false
     *         description: Number of users per page
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: Successful response with user data
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: integer
     *                   username:
     *                     type: string
     *                   user_level:
     *                     type: string
     *       500:
     *         description: Failed to fetch users
     */
    app.get('/users', getUsersHandler); // Register the /users route


    /*******************************
     * Metrics
     *******************************/

    /**
     * @swagger
     * /metrics/user-download-frequency:
     *   get:
     *     summary: Get user download frequency
     *     responses:
     *       200:
     *         description: Successful response with user download frequency data
     *       500:
     *         description: Failed to retrieve user download frequency
     */
    app.get('/metrics/user-download-frequency', getUserDownloadFrequency);

    /**
     * @swagger
     * /metrics/total-feeds:
     *   get:
     *     summary: Get total number of feeds
     *     responses:
     *       200:
     *         description: Successful response with total feeds count
     *       500:
     *         description: Failed to retrieve total feeds
     */
    app.get('/metrics/total-feeds', getTotalFeeds);

    /**
     * @swagger
     * /metrics/feed-pull-frequency:
     *   get:
     *     summary: Get feed pull frequency
     *     responses:
     *       200:
     *         description: Successful response with feed pull frequency data
     *       500:
     *         description: Failed to retrieve feed pull frequency
     */
    app.get('/metrics/feed-pull-frequency', getFeedPullFrequency);

    /**
     * @swagger
     * /metrics/item-count:
     *   get:
     *     summary: Get the count of RSS items
     *     responses:
     *       200:
     *         description: Successful response with the count of RSS items
     *       500:
     *         description: Failed to retrieve RSS items count
     */
    app.get('/metrics/item-count', getRssItemsCountHandler);


    /*******************************
     * Logging
     *******************************/

    /**
     * @swagger
     * /frontend-logs:
     *   post:
     *     summary: Error Logging
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Successful post
     *       204:
     *         description: Successful Options
     *       403:
     *         description: Access denied
     *       500:
     *         description: Failed to post log
     */
    app.post('/frontend-logs', logHandler); // Log endpoint
}

