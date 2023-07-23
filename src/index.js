const mongoose = require('mongoose');
const Bugsnag = require('@bugsnag/js');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
// const { startSearchEngine } = require('./middlewares/elasticsearch');
const { startSearchEngine } = require('./middlewares/algoliasearch');

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

mongoose.set('useFindAndModify', false);

startSearchEngine()
  .then(() => {
    logger.info('AlgoElasticsearch is ready!');
  })
  .catch((err) => {
    Bugsnag.notify(err);
    logger.error(err);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      Bugsnag.notify(new Error('Server closed'));
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  Bugsnag.notify(error);
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
