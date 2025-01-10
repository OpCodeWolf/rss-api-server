import request from 'supertest';
import RssServer from '../src/lib/RssServer';

const app = new RssServer().app;

describe('GET /rss', () => {
  it('should return a list of RSS feeds', async () => {
    const response = await request(app).get('/rss');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined(); // Ensure feeds are returned
  });
});
