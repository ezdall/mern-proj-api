require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
// const helmet = require('helmet');
// const fs = require('fs');

var a = 'a';

const { corsOptions } = require('./config/cors-options');
const { errorHandler } = require('./helpers/error-handler');
const { UrlError } = require('./helpers/url.error');
// const { logger } = require('./middlewares/logger');

const { rootRoute } = require('./routes');
const { userRoute } = require('./routes/user.route');
const { noteRoute } = require('./routes/note.route');
const { authRoute } = require('./routes/auth.route');

const app = express();

/** middlewares ----------------------------*/
app.use(cors(corsOptions));
app.use(morgan('dev'));
// app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(helmet())

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

module.exports = app;
