import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('PUT /update_user', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;
  });

  it('should update user information', async () => {
    const response = await request(app)
      .post('/update_user')
      .set('Authorization', `${token}`)
      .send({ username: 'admin', password: 'admin123', new_password: 'newpassword', verify_password: 'newpassword' });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User updated successfully');
  });

  it('should return an error for invalid user data', async () => {
    const response = await request(app)
      .post('/update_user')
      .set('Authorization', `${token}`)
      .send({ username: '', password: 'admin', new_password: 'newpassword', verify_password: 'newpassword' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username is required');
  });

  // Cleanup
  it('should reset the password to the original state', async () => {
    const response = await request(app)
      .post('/update_user')
      .set('Authorization', `${token}`)
      .send({ username: 'admin', password: 'newpassword', new_password: 'admin', verify_password: 'admin123' }); // Resetting to original password
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User updated successfully');
  });
});
