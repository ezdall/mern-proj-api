require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { connectMDB, mongoDisconnect } = require('./config/db');
const app = require('./app');

const validLogin = {
  username: 'guest',
  roles: ['Admin', 'Employee'],
  password: 'guest'
};

let token;
let data;

beforeAll(async () => {
  await connectMDB();

  token = jwt.sign(
    {
      username: validLogin.username,
      roles: validLogin.roles
    },
    process.env.ACCESS_SECRET,
    { expiresIn: '25min' }
  );

  // register
  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send(validLogin);
});

// beforeEach(async () => {});

// afterEach(async () => {
//   // await mongoose.connection.dropCollection('users');
// });

afterAll(async () => {
  await mongoose.connection.dropCollection('users');

  await mongoDisconnect();
});

describe('GET /users', () => {
  it('show users ', async () => {
    const { body } = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // find data of validLogin
    data = body.find(r => r.username === validLogin.username);

    expect(Array.isArray(body)).toBeTruthy();
  });

  it('no bearer token', async () => {
    const { body } = await request(app)
      .get('/api/users')
      .expect('Content-Type', /json/)
      .expect(401);

    // console.log({ body, headers });

    expect(body.message).toMatch(/No authorization/);
  });
});

describe('POST /users', () => {
  it('invalid data', async () => {
    const { body } = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);

    expect(body.message).toMatch(/info required/);
  });
});

describe('PATCH /users', () => {
  it('update data', async () => {
    const { body } = await request(app)
      .patch('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: data._id,
        username: 'guest2'
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.user).toMatchObject({
      username: 'guest2',
      roles: expect.any(Array),
      active: expect.any(Boolean)
    });

    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('hashed_password');
    expect(body.user).not.toHaveProperty('salt');
  });
});

describe('DELETE /users', () => {
  it('delete data', async () => {
    const { body } = await request(app)
      .delete('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: data._id
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.message).toMatch(/is deleted/);
  });
});

// describe('GET /profile/:userId', () => {
//   it('return user (200)', async () => {
//     const { body } = await request(app)
//       .get(`/profile/${validUser._id}`)
//       .set('Authorization', `Bearer ${token}`)
//       .expect('Content-Type', /json/)
//       .expect(200);

//     expect(body).toMatchObject({
//       email: validUser.email,
//       _id: validUser._id.toString()
//     });
//   });

// });

// describe('PUT /profile/:userId', () => {
//   it('update user', async () => {
//     const updateData = {
//       name: 'visitor'
//     };

//     const { body } = await request(app)
//       .put(`/profile/${validUser._id}`)
//       .set('Authorization', `Bearer ${token}`)
//       .send(updateData)
//       .expect('Content-Type', /json/)
//       .expect(200);

//     expect(body).toMatchObject({
//       email: validUser.email,
//       _id: validUser._id.toString(),
//       ...updateData
//     });
//   });

// });
