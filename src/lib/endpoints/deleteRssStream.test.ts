import request from 'supertest';
import RssServer from '../RssServer';

const app = new RssServer().app;

describe('DELETE /delete_rss_stream/:id', () => {
  let token: string;
  let streamId: number;

  beforeAll(async () => {
    // Perform login to get the authentication token
    const loginResponse = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'admin' });
    token = loginResponse.body.token;

    // Create a stream to delete
    const createResponse = await request(app)
      .post('/rss_streams')
      .set('Authorization', `${token}`)
      .send({ 'link': 'https://justinpot.com/feed' });
    streamId = createResponse.body.id; // Assuming the response contains the ID of the created stream

  });

  it('should delete an existing RSS stream', async () => {
    const response = await request(app)
      .delete(`/rss_streams/${streamId}`)
      .set('Authorization', `${token}`);
    expect(response.status).toBe(204);
  });

  it('should return no error for non-existing stream ID', async () => {
    const response = await request(app)
      .delete('/rss_streams/99999') // Non-existing ID
      .set('Authorization', `${token}`);
    expect(response.status).toBe(204);
  });
});
