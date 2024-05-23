require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const { connectMDB, mongoDisconnect } = require('./config/db');
const app = require('./app');

const validLogin = {
  username: 'guest',
  roles: ['Admin', 'Employee'],
  password: 'guest'
};

const invalidPass = {
  username: 'guest',
  password: 'invalid'
};

const invalidLogin = {
  username: 'guest2',
  password: 'guest'
};

let token;
let refreshToken;

beforeAll(async () => {
  await connectMDB();

  refreshToken = jwt.sign(
    { username: validLogin.username },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  token = jwt.sign(
    {
      username: validLogin.username,
      roles: validLogin.roles
    },
    process.env.ACCESS_SECRET,
    { expiresIn: '25min' }
  );

  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send(validLogin);
});

// beforeEach(async () => {});

// afterEach(async () => {});

afterAll(async () => {
  await mongoose.connection.dropCollection('users');

  await mongoDisconnect();
});

describe('POST /api/auth', () => {
  it('valid signin (200) resp w/ cookie', async () => {
    const { headers, body } = await request(app)
      .post('/api/auth')
      .send(validLogin)
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    // cookie
    expect(headers['set-cookie'][0]).toMatch(
      // /jwt=.*; Max-Age=\d+; Path=\/; Expires=.*/
      /jwt=.*; Max-Age=\d+; Path=\/; Expires=.*; HttpOnly; Secure; Partitioned; SameSite=None/
    );

    // accessToken, user
    expect(body).toMatchObject({
      accessToken: expect.any(String),
      user: expect.any(Object)
    });

    // check user
    expect(body.user).toMatchObject({
      username: validLogin.username,
      roles: expect.any(Array),
      _id: expect.any(String)
    });

    expect(['Admin', 'Employee', 'Manager']).toEqual(
      expect.arrayContaining(body.user.roles)
    );

    // check token
    const decoded = jwt.verify(body.accessToken, process.env.ACCESS_SECRET);

    expect(decoded).toMatchObject({
      username: validLogin.username,
      iat: expect.any(Number),
      exp: expect.any(Number)
    });

    // no password related
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('salt');
    expect(body.user).not.toHaveProperty('hashed_password');
  });

  it('wrong password, (401) error', async () => {
    const { body } = await request(app)
      .post('/api/auth')
      .send(invalidPass)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body.message).toMatch(/wrong password/);
  });

  it('invalid or not-found user/email', async () => {
    const { body } = await request(app)
      .post('/api/auth')
      .send(invalidLogin)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body.message).toMatch(/User not found/);
  });
});

describe('GET /logout', () => {
  it('logout 204 (no-content), clear cookie', async () => {
    const { headers } = await request(app)
      .get('/api/auth/logout')
      // .set('Cookie', [`jwt=${refreshToken}`])
      .expect(204);

    // no content, empty body coz 204
    expect(headers).not.toHaveProperty('Content-Type');

    // clear/reset
    expect(headers['set-cookie'][0]).toMatch(
      'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; Partitioned; SameSite=None'
    );
  });
});

describe('GET /refresh', () => {
  it('refresh', async () => {
    const { body } = await request(app)
      .get('/api/auth/refresh')
      .set('Cookie', [`jwt=${refreshToken}`])
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    // accessToken, user
    expect(body).toMatchObject({
      accessToken: expect.any(String),
      user: expect.any(Object)
    });

    // not same w/ prev token
    expect(body.accessToken).not.toBe(token);

    // check user
    expect(body.user).toMatchObject({
      username: validLogin.username,
      roles: expect.any(Array),
      active: true,
      _id: expect.any(String)
    });

    expect(['Admin', 'Employee', 'Manager']).toEqual(
      expect.arrayContaining(body.user.roles)
    );

    // no password related
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('salt');
    expect(body.user).not.toHaveProperty('hashed_password');
  });

  it('invalid cookie token', async () => {
    const { body } = await request(app)
      .get('/api/auth/refresh')
      .set('Cookie', ['jwt=in.Valid.Token'])
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body.message).toMatch(/invalid token/);
  });
});

/** * * *    REGISTER    * * */

// describe('POST /register', () => {
//   it('register success (201)', async () => {
//     // supertest has convenient way http
//     const { body } = await request(app)
//       .post('/register')
//       .send(validRegister)
//       .expect('Content-Type', /json/) // regex json
//       .expect(201);

//     expect(body).toHaveProperty('user');

//     expect(body.user).toHaveProperty('_id');
//     expect(body.user).toMatchObject({
//       email: validRegister.email
//     });

//     // no password related
//     expect(body.user).not.toHaveProperty('password');
//     expect(body.user).not.toHaveProperty('salt');
//     expect(body.user).not.toHaveProperty('hashed_password');
//   });

//   it('register duplicate (409) error', async () => {
//     const { body } = await request(app)
//       .post('/register')
//       .send(validLogin) // duplicate
//       .expect('Content-Type', /json/)
//       .expect(409); // express-jwt duplicate error

//     expect(body.error).toMatch(/already exist/);
//   });

//   it('register duplicate (409) in upper-case', async () => {
//     // email has lowercase: true

//     const { body } = await request(app)
//       .post('/register')
//       .send(casedLogin)
//       .expect('Content-Type', /json/)
//       .expect(409); //

//     expect(body.error).toMatch(/already exist/);
//   });

//   it('register w/ space-password, (400) error', async () => {
//     const { body } = await request(app)
//       .post('/register')
//       .send(spacePassRegister)
//       .expect('Content-Type', /json/)
//       .expect(400); //

//     expect(body.error).toMatch(/validation error/);
//     // expect(body.error).toMatch(/all fields required/);
//   });
// });
