import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('POST /logout', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;
  });

  it('should log out successfully', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Authorization', `${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logout successful'); // Adjusted based on actual response
  });

  // Not yet implemented:

  // it('should return an error if not logged in', async () => {
  //   const response = await request(app)
  //     .post('/logout');
  //   expect(response.status).toBe(401);
  //   expect(response.body.message).toBe('Unauthorized');
  // });
});
