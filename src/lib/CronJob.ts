import cron from 'node-cron';
import RssServer from './RssServer';
import express from 'express';
import { updateRssFeedsHandler } from './endpoints/rssUpdateStreams';

export default class CronJob {
    private rssServer: RssServer;
  
    constructor(rssServer: RssServer) {
      this.rssServer = rssServer;
    }
  
    public start() {
      // TODO: make this configurable in the Settings API

      // Schedule the job to run every hour (on the 0th minute)
      /**
       *             ┌────────────── second (optional)
       *             │ ┌──────────── minute
       *             │ │ ┌────────── hour
       *             │ │ │ ┌──────── day of month
       *             │ │ │ │ ┌────── month
       *             │ │ │ │ │ ┌──── day of week
       *             │ │ │ │ │ │
       *             │ │ │ │ │ │
       *             * * * * * *           
       */
      cron.schedule('  0 * * * *', async () => {
        console.log('Updating RSS feeds...');
        const mockResponse = {
          status: (code: number) => {
            return {
              json: (data: any) => console.log(`Response: ${code}`, data),
              send: () => console.log(`Response sent with status: ${code}`)
            };
          }
        };
  
        try {
          await updateRssFeedsHandler({} as express.Request, mockResponse as express.Response);
        } catch (error) {
          console.error('Error updating RSS feeds:', error);
        }
      });
    }
  }
  