import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('GET /', () => {
  it('should return a welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
