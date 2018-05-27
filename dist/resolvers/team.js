'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _formatErrors = require('../formatErrors');

var _formatErrors2 = _interopRequireDefault(_formatErrors);

var _permissions = require('../permissions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // for formatting the sequelize validation errors


// for checking if user available in context

exports.default = {
  Query: {
    // the getTeamMembers query. here we select the team members where the teamId is the teamId
    // passed in args and also, select the current user.
    getTeamMembers: _permissions.requiresAuth.createResolver((() => {
      var _ref = _asyncToGenerator(function* (parent, { teamId }, { models }) {
        return models.sequelize.query('SELECT * FROM users JOIN members on members.user_id = users.id where members.team_id = ?', {
          replacements: [teamId],
          model: models.User,
          raw: true
        });
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })())
  },
  Mutation: {
    // the create team mutation - uses the models and the user passed in context to create a team
    // and return a response corresponding to the creatTeamResponse in the schema. Alost add the
    // current creator of the team as member with admin true.
    createTeam: _permissions.requiresAuth.createResolver((() => {
      var _ref2 = _asyncToGenerator(function* (parent, args, { models, user }) {
        try {
          const response = yield models.sequelize.transaction((() => {
            var _ref3 = _asyncToGenerator(function* (transaction) {
              const team = yield models.Team.create(_extends({}, args), { transaction });
              yield models.Member.create({ admin: true, teamId: team.id, userId: user.id }, { transaction });
              yield models.Channel.create({ name: 'general', public: true, teamId: team.id }, { transaction });
              return team;
            });

            return function (_x7) {
              return _ref3.apply(this, arguments);
            };
          })());
          return {
            ok: true,
            team: response
          };
        } catch (err) {
          console.log(err);
          // incase of errors, we return false
          return {
            ok: false,
            errors: (0, _formatErrors2.default)(err, models)
          };
        }
      });

      return function (_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      };
    })()),
    // the add member mutation. We first find the member in the members table and then add the
    // user to be added to the user table.
    addMember: _permissions.requiresAuth.createResolver((() => {
      var _ref4 = _asyncToGenerator(function* (parent, { email, teamId }, { models, user }) {
        try {
          const memberPromise = models.Member.findOne({
            where: {
              userId: user.id,
              teamId
            }
          });
          const userToAddPromise = models.User.findOne({ where: { email } });
          const [member, userToAdd] = yield Promise.all([memberPromise, userToAddPromise]);
          // if the current member trying to add the user is not an admin, we can return false
          if (!member.admin) {
            return {
              ok: false,
              errors: [{ path: 'admin', message: 'You cannot add members to the team' }]
            };
          }
          // else if the userToAdd doesn't exist, that is there is no member with that email, we
          // return false, otherwise we add this user to the members table.
          if (!userToAdd) {
            return {
              ok: false,
              errors: [{ path: 'email', message: 'Could not find that email' }]
            };
          }
          yield models.Member.create({ userId: userToAdd.id, teamId });
          return {
            ok: true
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            errors: (0, _formatErrors2.default)(err, models)
          };
        }
      });

      return function (_x8, _x9, _x10) {
        return _ref4.apply(this, arguments);
      };
    })())
  },
  Team: {
    // to get the channels for the team, we use this query - join channel with pcMembers where
    // channelId is the pcmembers.channel_id. We search where current team is the teamId passed
    // in args and the channel is public or pc.user_id is the same as the id of the user in context.
    channels: ({ id }, args, { channelLoader }) => channelLoader.load(id),
    // to get theh directMessageMembers, we join the users table with the dm table. The user id
    // should match the sender or receiver id in the dm table and the team should match the teamId
    // in the parent.
    directMessageMembers: ({ id }, args, { models, user }) => models.sequelize.query(`
        SELECT DISTINCT on (u.id) u.id, u.username 
        FROM users AS u JOIN direct_messages AS dm 
        ON (u.id = dm.sender_id OR u.id = dm.receiver_id) 
        WHERE (:currentUserId=dm.receiver_id OR :currentUserId = dm.sender_id) AND dm.team_id = :teamId`, {
      replacements: {
        currentUserId: user.id,
        teamId: id
      },
      model: models.User,
      raw: true
    })
  }
};