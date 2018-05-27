'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addUser = undefined;

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _index = require('./index');

var _auth = require('./auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // to verify the set headers

// the DB models we setup using psql and sequelize.
// required as a key for verification


// required for refreshing tokens

const addUser = exports.addUser = (() => {
  var _ref = _asyncToGenerator(function* (req, res, next) {
    const token = req.headers['x-token']; // get the token from the x-token header
    // if the token is available (hasn't expired, just verify it with the secret that we are provided)
    // and then attach this user to the req so it can be used in the context of the graphqlExpress.
    // otherwise, get refreshTokens from the header (which have a much longer validity)
    // sue the refreshToken to get a new set of token and refresh token
    // once they are available, we can set the headers to these new tokens here, in the response
    // and finally, attach this new user to the requests.
    if (token) {
      try {
        const { user } = _jsonwebtoken2.default.verify(token, _index.SECRET);
        req.user = user;
      } catch (err) {
        const refreshToken = req.headers['x-refresh-token'];
        const newTokens = yield (0, _auth.refreshTokens)(token, refreshToken, _models2.default, _index.SECRET, _index.SECRET2);
        if (newTokens.token && newTokens.refreshToken) {
          res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
          res.set('x-token', newTokens.token);
          res.set('x-refresh-token', newTokens.refreshToken);
        }
        req.user = newTokens.user;
      }
    }
    // pass to next middleware
    next();
  });

  return function addUser(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();