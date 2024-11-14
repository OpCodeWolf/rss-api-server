import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('DELETE /delete_user/:username', () => {
  let token: string;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;

    // Create an existing user for the tests.
    const response = await request(app)
      .post('/create_user') // Replace with a valid username
      .set('Authorization', `${token}`)
      .send({ username: 'existinguser', password: 'existingpassword' });
  });

  it('should delete an existing user', async () => {
    const response = await request(app)
      .delete('/delete_user/existinguser') // Replace with a valid username
      .set('Authorization', `${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User deleted successfully');
  });

  it('should return an error for non-existing user', async () => {
    const response = await request(app)
      .delete('/delete_user/nonexistinguser') // Replace with a username that does not exist
      .set('Authorization', `${token}`);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should return an error for missing username', async () => {
    const response = await request(app)
      .delete('/delete_user/') // Missing username
      .set('Authorization', `${token}`);
    expect(response.status).toBe(404);
  });
});
