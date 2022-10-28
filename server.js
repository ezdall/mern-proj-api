const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const { connectMDB } = require('./config/db');
const { errorHandler } = require('./helpers/error-handler');
const { logger } = require('./middlewares/logger');

const { rootRoute } = require('./routes');
const { UrlError } = require('./helpers/url.error');

dotenv.config({
  path: './config/config.env'
});

connectMDB().catch(err => console.error('connect-MongoDB Error', err.stack));

const app = express();

const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(morgan('dev'));
// app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use('/', express.static(path.join(__dirname, 'views')));

app.use('/', rootRoute);

app.use('/api', (req, res) => {
  return res.json('hi world');
});

app.all('*', (req, res, next) => {
  const error = new UrlError(`${req.ip} tried to access ${req.originalUrl}`);

  return next(error);
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  app.listen(PORT, err => {
    if (err) throw err;
    console.log(`MERN-Proj Server is running on http://localhost:${PORT}`);
  });
});

mongoose.connection.on('error', err => {
  console.error('error @mongoo-conn-error ---', err);
});

module.exports = app;
