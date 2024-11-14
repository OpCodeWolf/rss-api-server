import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('GET /rss_streams', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;
  });

  it('should return a list of RSS streams', async () => {
    const response = await request(app)
      .get('/rss_streams')
      .set('Authorization', `${token}`);
    expect(response.status).toBe(200);
    expect(response.body[0].id).toBeDefined(); // Ensure streams are returned
  });

  it('should return an error if not authenticated', async () => {
    const response = await request(app).get('/rss_streams');
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Invalid or missing token');
  });
});
