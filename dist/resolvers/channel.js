'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _formatErrors = require('../formatErrors');

var _formatErrors2 = _interopRequireDefault(_formatErrors);

var _permissions = require('../permissions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // for formatting the sequelize validation errors


// for only allowing authorized users

exports.default = {
  Mutation: {
    // the getOrCreateChannel mutation used for creating a channel for direct messaging. If
    // we already have a channel for the person or group that we want to talk to, then we
    // get the channel otherwise we create the channel.
    getOrCreateChannel: _permissions.requiresAuth.createResolver((() => {
      var _ref = _asyncToGenerator(function* (parent, { teamId, members }, { models, user }) {
        // check if the current user is a part of this team where we want to create the channel.
        const member = yield models.Member.findOne({
          where: {
            teamId,
            userId: user.id
          }
        });

        // if such a member is not found, throw an error.
        if (!member) {
          throw new Error('Not authorized');
        }

        // otherwise add current user to array of all members that we receive as args.
        // get the data from the sequelize query (sequelize query returns two things - current data
        // and results). In the query, we get the channelId and channelName where the
        // privateChannelId is the channelId and the dm type for the channel is true. Also, the
        // channel should be a part of the same team. Finally, the members of the channel and the
        // number of members should be the same as the length of allMembers array.
        const allMembers = [...members, user.id];
        const [data] = yield models.sequelize.query(`
          SELECT c.id, c.name
          FROM channels AS c, pcmembers AS PC
          WHERE pc.channel_id = c.id AND c.dm = true AND c.public = false AND c.team_id = ${teamId}
          GROUP BY c.id, c.name
          HAVING array_agg(pc.user_id) @> Array[${allMembers.join(',')}] AND count(pc.user_id) = ${allMembers.length}
        `, {
          raw: true
        });

        // if such a channel is found, return it.
        if (data.length) {
          return data[0];
        }

        // otherwise, we create a new channel by first finding the users.
        const users = yield models.User.findAll({
          where: {
            id: {
              [models.sequelize.Op.in]: members
            }
          }
        });

        // we then map over these users and join them into an array by there username
        const name = users.map(function (u) {
          return u.username;
        }).join(', ');

        // finally, we do a transactions where we first create a channel with type public false
        // and dm true. We also map the allMembers with userId and channelId and add all of them to
        // the PCmembers tables simoultaneously. We then return the channelId.
        const response = yield models.sequelize.transaction((() => {
          var _ref2 = _asyncToGenerator(function* (transaction) {
            const channel = yield models.Channel.create({
              name,
              public: false,
              dm: true,
              teamId
            }, { transaction });

            const channelId = channel.dataValues.id;
            const pcmembers = allMembers.map(function (m) {
              return { userId: m, channelId };
            });
            yield models.PCMember.bulkCreate(pcmembers, { transaction });
            return channelId;
          });

          return function (_x4) {
            return _ref2.apply(this, arguments);
          };
        })());

        // finally, we return the channelId and the name of the channel that was created above.
        return {
          id: response,
          name
        };
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })()),

    // the createChannel mutation is for creating a regular channel. This also requires auth.
    createChannel: _permissions.requiresAuth.createResolver((() => {
      var _ref3 = _asyncToGenerator(function* (parent, args, { models, user }) {
        try {
          // check if the current member is a part of the same team.
          const member = yield models.Member.findOne({
            where: {
              teamId: args.teamId,
              userId: user.id
            }
          });

          // if this member is not an admin, then we can just return false and pass the error.
          if (!member.admin) {
            return {
              ok: false,
              errors: [{
                path: 'name',
                message: 'You have to be owener of the team to create channels'
              }]
            };
          }

          // otherwise, we create a transaction: first we create a channel with the given args
          const response = yield models.sequelize.transaction((() => {
            var _ref4 = _asyncToGenerator(function* (transaction) {
              const channel = yield models.Channel.create(args, { transaction });
              // if the channel we are trying to create is not public, we remove the current userId
              // from the members array that is passed in the args and manually push (to ensure)
              // that no duplicates are added. We then map these members according to the userId and
              // channelId and add them in bulk to the pcMembers table.
              if (!args.public) {
                const members = args.members.filter(function (m) {
                  return m !== user.id;
                });
                members.push(user.id);
                const pcmembers = members.map(function (m) {
                  return {
                    userId: m,
                    channelId: channel.dataValues.id
                  };
                });
                yield models.PCMember.bulkCreate(pcmembers, { transaction });
              }
              return channel;
            });

            return function (_x8) {
              return _ref4.apply(this, arguments);
            };
          })());

          // we can then return the channel that we created and an ok response.
          return {
            ok: true,
            channel: response
          };
        } catch (err) {
          // in case of any errors, we return ok false and the errors properly formatted.
          console.log(err);
          return {
            ok: false,
            errors: (0, _formatErrors2.default)(err, models)
          };
        }
      });

      return function (_x5, _x6, _x7) {
        return _ref3.apply(this, arguments);
      };
    })())
  }
};