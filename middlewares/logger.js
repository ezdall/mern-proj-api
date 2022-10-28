const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fsPromises = require('fs').promises;

const logEvents = async (msg, logFileName) => {
  const dateTime = `${format(new Date(), 'yyyy-MM-dd\tHH:mm:ss')}`;
  const logItem = `${dateTime}\t${uuid()}\t${msg}\n`;

  try {
    // check logs folder
    if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
      await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
    }
    await fsPromises.appendFile(
      path.join(__dirname, '..', 'logs', logFileName),
      logItem
    );
  } catch (error) {
    console.log({ error });
  }
};

const logger = (req, res, next) => {
  logEvents(
    `${req.method}\t${req.url}\t${res.statusCode}\t${req.headers.origin || ''}`,
    'reqLog.log'
  );
  // console.log(`${req.method} ${req.path} ${res.statusCode}  ${req.spee}`);
  next();
};

module.exports = { logEvents, logger };
