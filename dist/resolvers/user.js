'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _auth = require('../auth');

var _formatErrors = require('../formatErrors');

var _formatErrors2 = _interopRequireDefault(_formatErrors);

var _permissions = require('../permissions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // for login mutations
// for formatting sequelize validation errors


// for checking if user available in context

exports.default = {
  // simple queries where we just find the requested users in the db
  Query: {
    me: _permissions.requiresAuth.createResolver((parent, args, { models, user }) => models.User.findOne({ where: { id: user.id } })),
    getUser: _permissions.requiresAuth.createResolver((parent, { userId }, { models }) => models.User.findOne({ where: { id: userId } })),
    allUsers: (parent, args, { models }) => models.User.findAll()
  },
  // the login mutation to try login using the strat defined in auth.js
  // the register mutation to create the user. Returns a response of type RegisterResponse.
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) => (0, _auth.tryLogin)(email, password, models, SECRET, SECRET2),
    register: (() => {
      var _ref = _asyncToGenerator(function* (parent, args, { models }) {
        try {
          const user = yield models.User.create(args);
          return {
            ok: true,
            user
          };
        } catch (err) {
          return {
            ok: false,
            errors: (0, _formatErrors2.default)(err, models)
          };
        }
      });

      return function register(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })()
  },
  User: {
    // to get the teams for the user, we join the members and teams table on the teamId and where
    // the userId is the id of the user in context.
    teams: _permissions.requiresAuth.createResolver((parent, args, { models, user }) => models.sequelize.query('SELECT * FROM teams JOIN members ON id = team_id WHERE user_id = ?', {
      replacements: [user.id],
      model: models.Team,
      raw: true
    }))
  }
};