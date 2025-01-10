import request from 'supertest';
import RssServer from '../src/lib/RssServer';
import * as database from '../src/lib/database';
import { UserLevel } from '../src/types/UserLevel';
import { User } from '../src/types/User';

const app = new RssServer().app;

const testUsername = 'unitTestUser';
const testPassword = 'unitTestPassword';
const newUsername = 'newUser';
const newPassword = 'newPassword';

describe('POST /create_user', () => {
  let token: string;

  beforeAll(async () => {
    // Create a test user directly in the db
    try {
      const response = await database.createUser(testUsername, testPassword, UserLevel.SUPERADMIN);
      console.log(JSON.stringify(response, null, 2));
    } catch (err) {
      // Intentionally left blank
    }

    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: testUsername, password: testPassword });
    token = loginResponse.body.token;
  });

  /**
   * @group unit
   */
  it('should create a new user (ID: 0001)', async () => {
    const response = await request(app)
      .post('/create_user')
      .set('Authorization', `${token}`)
      .send({ username: newUsername, password: newPassword });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
  });

  /**
   * @group unit
   */
  it('should return an error for duplicate username (ID: 0002)', async () => {
    const response = await request(app)
      .post('/create_user')
      .set('Authorization', `${token}`)
      .send({ username: newUsername, password: newPassword });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Username already exists');
  });

  /**
   * @group unit
   */
  it('should cleanup the existing test user (ID: 0003)', async () => {
    const response = await request(app)
      .delete(`/delete_user/${newUsername}`) // Replace with a valid username
      .set('Authorization', `${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User deleted successfully');
  });
});
