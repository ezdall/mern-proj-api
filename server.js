require('express-async-errors');
require('dotenv').config();

// for local
// require('dotenv').config({
//   path: './config/config.env'
// });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');

const { connectMDB } = require('./config/db');
const { corsOptions } = require('./config/cors-options');
const { logger } = require('./middlewares/logger');
const { errorHandler } = require('./helpers/error-handler');
const { UrlError } = require('./helpers/url.error');

const { rootRoute } = require('./routes');
const { userRoute } = require('./routes/user.route');
const { noteRoute } = require('./routes/note.route');
const { authRoute } = require('./routes/auth.route');

connectMDB().catch(err => console.error('connect-MongoDB Error', err.stack));

const app = express();

const PORT = process.env.PORT || 3000;

/** middlewares ----------------------------*/
app.use(cors(corsOptions));
// app.use(helmet())
app.use(morgan('dev'));
// app.use(logger);
app.use(express.json()); // bodyParser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use('/dist', express.static(path.join(__dirname, 'views')));

app.use(
  '/favicon.ico',
  express.static(path.join(__dirname, 'views', 'favicon.ico'))
);

app.use('/', rootRoute);

app.use('/api', [authRoute, userRoute, noteRoute]);

app.all('*', (req, res, next) => {
  const error = new UrlError(`${req.ip} tried to access ${req.originalUrl}`);

  return next(error);
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  const isProd = process.env.NODE_ENV === 'production';

  const nodeEnv = isProd ? 'PROD' : 'DEV';
  const hostNamePort = isProd
    ? 'techfixs-api.onrender.com'
    : `localhost:${PORT}`;

  app.listen(PORT, err => {
    if (err) throw err;
    console.log(`TechFix-Srv -${nodeEnv}- running at ${hostNamePort}`);
  });
});

mongoose.connection.on('error', err => {
  console.error('error @mongoo-conn-error ---', err);
});

// for local
// module.exports = app;
