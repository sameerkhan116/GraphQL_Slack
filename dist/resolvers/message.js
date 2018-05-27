'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _graphqlSubscriptions = require('graphql-subscriptions');

var _permissions = require('../permissions');

var _pubsub = require('../pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // withFilter to filter and subscribe to the proper directMessages.


// permission to check for authorization and if the members subscribed to the messages have
// access to the team.


// redis pubsub

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

exports.default = {
  Subscription: {
    // newChannelMessage subscription - check if members have teamAccess and check if the payload
    // channelId is the same as channelId passed as args.
    newChannelMessage: {
      subscribe: _permissions.requiresTeamAccess.createResolver((0, _graphqlSubscriptions.withFilter)(() => _pubsub2.default.asyncIterator(NEW_CHANNEL_MESSAGE), (payload, { channelId }) => payload.channelId === channelId))
    }
  },
  Query: {
    // query to get an array of messages.
    messages: _permissions.requiresAuth.createResolver((() => {
      var _ref = _asyncToGenerator(function* (parent, { cursor, channelId }, { models, user }) {
        // find the channel where channelId is same as that passed in args.
        const channel = yield models.Channel.findOne({
          where: {
            id: channelId
          }
        });

        // the channel is private, check if the current user in the context is a member of this
        // channel if he isn't, throw an error.
        if (!channel.public) {
          const member = yield models.PCMember.findOne({
            raw: true,
            where: {
              channelId,
              userId: user.id
            }
          });
          if (!member) {
            throw new Error('This is a private channel');
          }
        }

        const options = {
          order: [['created_at', 'DESC']],
          where: { channelId },
          limit: 35
        };

        if (cursor) {
          options.where.created_at = {
            [models.Sequelize.Op.lt]: cursor
          };
        }

        // otherwise, return the message in ascending order where the messages have the same
        // channelId as that passed in args.
        return models.Message.findAll(options, { raw: true });
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })())
  },
  Mutation: {
    // the createMessage mutation.
    createMessage: _permissions.requiresAuth.createResolver((() => {
      var _ref2 = _asyncToGenerator(function* (parent, _ref3, { models, user }) {
        let { file } = _ref3,
            args = _objectWithoutProperties(_ref3, ['file']);

        try {
          // we get the messagedata from the args (channelid, text, file)
          const messageData = args;
          // if the data is a file, then we get the filetype and filepath from it.
          if (file) {
            messageData.filetype = file.type;
            messageData.url = file.path;
          }

          const messagePromise = models.Message.create(_extends({}, messageData, {
            userId: user.id
          }));

          const userPromise = models.User.findOne({
            where: {
              id: user.id
            }
          });

          // we then create a new message in the messagemodel and find the user associated with the
          // message using the user.id in the context.
          const [message, currentUser] = yield Promise.all([messagePromise, userPromise]);

          // we publish this message so that it can read in the subscription with the channelId
          // and mesasge as the payload, and return true.
          _pubsub2.default.publish(NEW_CHANNEL_MESSAGE, {
            channelId: args.channelId,
            newChannelMessage: _extends({}, message.dataValues, { user: currentUser })
          });

          return true;
        } catch (err) {
          // in case of errors, we return false.
          console.log(err);
          return false;
        }
      });

      return function (_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      };
    })())
  },
  Message: {
    // url for the message type. WE do this so that everytime, we try to access the file, we don't
    // need to prepend the site url.
    url: (parent, args, { serverUrl }) => parent.url ? `${serverUrl}/${parent.url}` : parent.url,
    user: (() => {
      var _ref4 = _asyncToGenerator(function* ({ user: _user, userId }, args, { models }) {
        if (_user) {
          return _user;
        }
        return models.User.findOne({ where: { id: userId } });
      });

      return function user(_x7, _x8, _x9) {
        return _ref4.apply(this, arguments);
      };
    })()
  }
};