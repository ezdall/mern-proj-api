const mongoose = require('mongoose');

async function connectMDB() {
  const {
    MONGO_URI_FIXTECH_PROD,
    MONGO_URI_FIXTECH_DEV,
    MONGO_URI_TEST,
    NODE_ENV
  } = process.env;

  let mongoUri;

  if (NODE_ENV === 'production') {
    mongoUri = MONGO_URI_FIXTECH_PROD;
  } else if (NODE_ENV === 'test') {
    mongoUri = MONGO_URI_TEST;
  } else {
    mongoUri = MONGO_URI_FIXTECH_DEV;
  }
  try {
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });

    const { name, host, port } = conn.connection;

    if (NODE_ENV !== 'test') {
      console.log(
        `MongoDB Connected: ${host}:${port}/${name} pid:${process.pid}`
      );
    }
  } catch (error) {
    console.error('Error-at-DB-Connection:');
    console.error(error);

    process.exit(0); // exit 0-to clean exit, 1- to explicit error
  }
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = { connectMDB, mongoDisconnect };
