const path = require('path');
const { logEvents } = require('../middlewares/logger');

const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500;

  // .toString() to remove unnecessary error stack
  const errorReason = error.reason && error.reason.toString();

  if (error.reason) {
    console.error('| ==-- Error-Reason --== |:', errorReason);
  }

  // console.error('| ==--- MyErrorStack ---== |:', error.stack);
  console.log({
    ...error
  });

  // logEvents(
  //   `${error.name ?? 'Error'}: ${error.message ?? ''}\t${req.method}\t${
  //     req.url
  //   }\t${req.headers.origin ?? ''}`,
  //   'errLog.log'
  // );

  // if 'html'
  // if (req.accepts('html')) {
  //   if (error.statusCode === 404) {
  //     return res
  //       .status(status)
  //       .sendFile(path.join(__dirname, '..', 'views', '404.html'));
  //   }
  //   return res
  //     .status(status)
  //     .sendFile(path.join(__dirname, '..', 'views', '500.html'));
  // }

  // sent to default express errorHandler
  // can trigger if two res. ex. res.render() and res.json()
  if (res.headersSent) {
    console.error('* * * * -Header Sent-');
    return next(error);
  }

  // clientError
  if (req.xhr) {
    console.log('* * * xhr!!!');
    return res.status(500).json({ error: 'Something failed - xhr jquery' });
  }

  // jwt-express's authentication error-handling
  // redundant error.name??
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: `${error.name} : ${error.message}`
    });
  }

  if (error.name === 'CastError') {
    console.log('--CastError--');
  }

  if (error.name === 'ValidatorError') {
    console.log('--ValidatorError--');
  }

  if (error.name === 'MongooseError') {
    console.log('--Mongoose Error--');
  }

  if (error.name === 'UrlError') {
    return res.status(404).json({
      message: `cannot do ${req.method} on ${req.url}`
    });
  }

  // bad request
  if (error.statusCode === 400) {
    return res.status(400).json({
      message: `${error.name} : ${error.message}`
    });
  }

  if (error.statusCode === 404) {
    return res.status(404).json({
      message: `${error.name} : ${error.message}`
    });
  }

  if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
    return res.status(401).json({
      message: error.message
    });
  }

  // mongoose Error, duplicate 409
  if (error.name === 'MongoError' && [11_000, 11_001].includes(error.code)) {
    console.log('--MongoError--');

    const uniqueVal = Object.values(error.keyValue);

    // console.log(getUniqueErrorMessage(error))
    return res.status(409).json({ message: `${uniqueVal} already exist` });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'validation error'
    });
  }

  // add isError: true for redux RTK query
  return res
    .status(status)
    .json({ message: error.toString(), reason: errorReason });
};

module.exports = { errorHandler };
