const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const { connectMDB } = require('./config/db');
const { corsOptions } = require('./config/cors-options');
const { logger } = require('./middlewares/logger');
const { errorHandler } = require('./helpers/error-handler');
const { UrlError } = require('./helpers/url.error');

const { rootRoute } = require('./routes');
const { userRoute } = require('./routes/user.route');

dotenv.config({
  path: './config/config.env'
});

connectMDB().catch(err => console.error('connect-MongoDB Error', err.stack));

const app = express();

const PORT = parseInt(process.env.PORT, 10) || 3000;

/** middlewares ----------------------------*/
app.use(cors(corsOptions));
app.use(morgan('dev'));
// app.use(logger);
app.use(express.json()); // bodyParser
app.use(express.urlencoded({ extended: true }));

// app.use('/', express.static(path.join(__dirname, 'views')));

app.use('/', rootRoute);

app.use('/api', [userRoute]);

app.all('*', (req, res, next) => {
  const error = new UrlError(`${req.ip} tried to access ${req.originalUrl}`);

  // no need to log
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
