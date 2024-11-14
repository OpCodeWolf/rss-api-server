import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('POST /create_user', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/create_user')
      .set('Authorization', `${token}`)
      .send({ username: 'newuser', password: 'newpassword' });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
  });

  it('should return an error for duplicate username', async () => {
    const response = await request(app)
      .post('/create_user')
      .set('Authorization', `${token}`)
      .send({ username: 'newuser', password: 'newpassword' });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Username already exists');
  });

  it('should cleanup the existing test user', async () => {
    const response = await request(app)
      .delete('/delete_user/newuser') // Replace with a valid username
      .set('Authorization', `${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User deleted successfully');
  });
});
