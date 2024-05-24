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

// inputNote
const validNote = {
  title: 'title',
  text: 'text description'
};

const editNote = {
  title: 'title edit',
  text: 'text edit'
};

const emptyNote = {
  title: 'title',
  text: ''
};

let token;
let user;
let note;

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

  // login
  const resp = await request(app).post('/api/auth').send(validLogin);
  user = resp.body.user;

  // create note
  const respNote = await request(app)
    .post('/api/notes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      ...validNote,
      user: user._id
    });

  note = respNote.body.note;
});

afterAll(async () => {
  await mongoose.connection.dropCollection('notes');
  await mongoose.connection.dropCollection('users');

  await mongoDisconnect();
});

describe('GET /api/notes', () => {
  it('all notes', async () => {
    const { body } = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // find data of validLogin
    // data = body.find(r => r.username === validLogin.username);

    expect(Array.isArray(body)).toBeTruthy();
  });

  it('no bearer token', async () => {
    const { body } = await request(app)
      .get('/api/notes')
      .expect('Content-Type', /json/)
      .expect(401);

    // jwt error
    expect(body.message).toMatch(/UnauthorizedError.+No authorization/);
  });
});

describe('POST /api/notes', () => {
  it('lack note info', async () => {
    const { body } = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...emptyNote, user: user._id })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(body.message).toMatch(/info required/);
  });

  it('invalid user id', async () => {
    const { body } = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validNote,
        user: '12345'
      })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body.message).toMatch(/id is required/);
  });
});

describe('PATCH /api/notes', () => {
  it('invalid note id', async () => {
    const { body } = await request(app)
      .patch('/api/notes/12345') // api/notes/:noteId
      .set('Authorization', `Bearer ${token}`)
      .send(editNote)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body.message).toMatch(/invalid note id/);
  });

  it('note updated', async () => {
    const { body } = await request(app)
      .patch(`/api/notes/${note._id}`) // api/notes/:noteId
      .set('Authorization', `Bearer ${token}`)
      .send(editNote)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.message).toMatch(/updated/);
  });
});

describe('DELETE /api/notes', () => {
  it('invalid note id', async () => {
    const { body } = await request(app)
      .delete('/api/notes/12345') // api/notes/:noteId
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body.message).toMatch(/invalid note id/);
  });

  it('note is deleted', async () => {
    const { body } = await request(app)
      .delete(`/api/notes/${note._id}`) // api/notes/:noteId
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.message).toMatch(/is deleted/);
  });
});
