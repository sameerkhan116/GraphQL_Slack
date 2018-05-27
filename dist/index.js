'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SECRET2 = exports.SECRET = undefined;

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _apolloServerExpress = require('apollo-server-express');

var _graphqlTools = require('graphql-tools');

var _mergeGraphqlSchemas = require('merge-graphql-schemas');

var _http = require('http');

var _graphql = require('graphql');

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

require('colors');

var _dataloader = require('dataloader');

var _dataloader2 = _interopRequireDefault(_dataloader);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _addUser = require('./addUser');

var _auth = require('./auth');

var _fileMiddleware = require('./fileMiddleware');

var _fileMiddleware2 = _interopRequireDefault(_fileMiddleware);

var _batchFunctions = require('./batchFunctions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // for setting up the server.
// to parse the messages in form body.
// for setting up the /graphql endpoint with the schema.
// to create the schema with the type definitions and resolvers that we write.
// for modularizing our graphql types.
// for specifying the dirname to types and resolvers
// for cross origin resource sharing
// for adding colors to the terminal.
// to allow batched and cached backend requests

// the DB models we setup usi./src/addUsernd sequelize.
// required for refreshing tokens


const typeDefs = (0, _mergeGraphqlSchemas.mergeTypes)((0, _mergeGraphqlSchemas.fileLoader)(_path2.default.join(__dirname, './types'))); // // merege all modularized types
const resolvers = (0, _mergeGraphqlSchemas.mergeResolvers)((0, _mergeGraphqlSchemas.fileLoader)(_path2.default.join(__dirname, './resolvers'))); // merege all modularized resolvers
const PORT = 3000; // port on which our app is running.
const app = (0, _express2.default)(); // app - an executable server using express.
const server = (0, _http.createServer)(app);
const endpointURL = '/graphql'; // our graphql enpoint
const subscriptionsEndpoint = `ws://localhost:${PORT}/subscriptions`;
const SECRET = exports.SECRET = 'kdshakdjlasdjaskdj'; // required for login authentication
const SECRET2 = exports.SECRET2 = 'dasldkasldkashasjd'; // required for login authentication
// the schema we create by passing the typedefs and their resolvers.
const schema = (0, _graphqlTools.makeExecutableSchema)({ typeDefs, resolvers });
// setting up the /graphql endpoint with graphqlExpress that requires the schema.
app.use((0, _cors2.default)('*'));
app.use(_addUser.addUser); // use the add user middleware to attach user to req.
app.use(endpointURL, _bodyParser2.default.json(), _fileMiddleware2.default, (0, _apolloServerExpress.graphqlExpress)(req => ({
  schema,
  context: {
    models: _models2.default, // attach the models (db)
    user: req.user, // attach the user from addUser middleware
    SECRET,
    SECRET2,
    channelLoader: new _dataloader2.default(ids => (0, _batchFunctions.channelBatcher)(ids, _models2.default, req.user)),
    serverUrl: `${req.protocol}://${req.get('host')}`
  }
})));
app.use('/graphiql', (0, _apolloServerExpress.graphiqlExpress)({
  endpointURL,
  subscriptionsEndpoint
}));
app.use('/files', _express2.default.static('files'));

// before running the server, we need to sync the db models that we created with sequelize.
// this returns a promise. When it is resolved, we can start the server.
_models2.default.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    // eslint-disable-next-line
    new _subscriptionsTransportWs.SubscriptionServer({
      execute: _graphql.execute,
      subscribe: _graphql.subscribe,
      schema,
      // eslint-disable-next-line
      onConnect: (() => {
        var _ref = _asyncToGenerator(function* ({ token, refreshToken }, webSocket) {
          if (token && refreshToken) {
            try {
              const { user } = _jsonwebtoken2.default.verify(token, SECRET);
              // eslint-disable-next-line
              return {
                models: _models2.default,
                user
              };
            } catch (err) {
              const newTokens = yield (0, _auth.refreshTokens)(token, refreshToken, _models2.default, SECRET, SECRET2);
              // eslint-disable-next-line
              return {
                models: _models2.default,
                user: newTokens.user
              };
            }
          }
          return {};
        });

        return function onConnect(_x, _x2) {
          return _ref.apply(this, arguments);
        };
      })()
    }, {
      // the endpoint for subscriptions
      server,
      path: '/subscriptions'
    });
    console.log(`Listening on http://localhost:${PORT}`.yellow.underline);
  });
});