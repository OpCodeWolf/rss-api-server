import request from 'supertest';
import RssServer from '../src/lib/RssServer';

const app = new RssServer().app;

describe('POST /encrypt', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;
  });

  it('should encrypt the provided data', async () => {
    const response = await request(app)
      .post('/encrypt')
      .set('Authorization', `${token}`)
      .send({ 'input': 'sensitive data' });
    expect(response.status).toBe(200);
    expect(response.body.hash).toBeDefined(); // Ensure encrypted data is returned
  });

  it('should return an error for missing data', async () => {
    const response = await request(app)
      .post('/encrypt')
      .set('Authorization', `${token}`)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Input string is required');
  });

  it('should return an error if not authenticated', async () => {
    const response = await request(app)
      .post('/encrypt')
      .send({ 'input': 'string' });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Invalid or missing token');
  });
});
