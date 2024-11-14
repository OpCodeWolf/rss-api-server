import request from 'supertest';
import RssServer from '../RssServer'; // Adjusting to point to the compiled output

const app = new RssServer().app;

describe('GET /rss_items', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login') // Assuming the login endpoint is /login
      .send({ username: 'admin', password: 'admin' }); // Use valid credentials
    token = loginResponse.body.token;
  });

  it('should return the first page of RSS items with default page size', async () => {
    const response = await request(app)
      .get('/rss_items?page=1&page_size=20')
      .set('Authorization', `${token}`); // Set the token in the Authorization header
    // console.log('Response Body:', response.body); // Log the response body
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeLessThanOrEqual(20); // Ensure it returns up to 20 items
  });

  it('should return the second page of RSS items with default page size', async () => {
    const response = await request(app)
      .get('/rss_items?page=2&page_size=20')
      .set('Authorization', `${token}`); // Set the token in the Authorization header
    // console.log('Response Body:', response.body); // Log the response body
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeLessThanOrEqual(20); // Ensure it returns up to 20 items
  });

  it('should return a specific page of RSS items with custom page size', async () => {
    const response = await request(app)
      .get('/rss_items?page=1&page_size=10')
      .set('Authorization', `${token}`); // Set the token in the Authorization header
    // console.log('Response Body:', response.body); // Log the response body
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeLessThanOrEqual(10); // Ensure it returns up to 10 items
  });
});
