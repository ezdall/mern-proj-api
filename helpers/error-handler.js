const path = require('path');

const errorHandler = (error, req, res, next) => {
  const status = error.statusCode || 500;

  // .toString() to remove unnecessary error stack
  const errorReason = error.reason && error.reason.toString();

  if (error.reason) {
    console.error('| ==-- Error-Reason --== |:', errorReason);
  }

  console.error('| ==--- MyErrorStack ---== |:', error.stack);
  // console.log({error})

  // if 'html'
  if (req.accepts('html')) {
    if (error.statusCode === 404) {
      return res.sendFile(path.join(__dirname, '..', 'views', '404.html'));
    }
    return res.sendFile(path.join(__dirname, '..', 'views', '500.html'));
  }

  // sent to default express errorHandler
  // can trigger if two res. ex. res.render() and res.json()
  if (res.headersSent) {
    console.error('* * * * -Header Sent-');
    return next(error);
  }

  // jwt-express's authentication error-handling
  // redundant error.name??
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: `${error.name} : ${error.message}`
    });
  }

  if (error.statusCode === 400) {
    return res.status(400).json({
      error: `${error.name} : ${error.message}`
    });
  }

  //  if(error.statusCode === 401){
  //   return res.status(401).json({
  //     error: `${error.name} : ${error.message}`
  //   })
  // }

  // mongoose Error, duplicate
  if (error.name === 'MongoError' && error.code === (11000 || 11001)) {
    const uniqueVal = Object.values(error.keyValue);

    // console.log(getUniqueErrorMessage(error))
    return res.status(409).json({ error: `${uniqueVal} already exist` });
  }

  // clientError
  if (req.xhr) {
    console.log('* * * xhr!!!');
    return res.status(500).json({ error: 'Something failed - xhr jquery' });
  }

  return res
    .status(status)
    .json({ message: error.toString(), reason: errorReason });
};

module.exports = { errorHandler };
