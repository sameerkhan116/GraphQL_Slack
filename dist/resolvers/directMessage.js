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

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // the withFilter function from graphql-subscriptions to filter unnecessary messages


// the requiresAuth and directMessageSubscription permission to make sure only authorized
// people access the messages.


// the redis pubsub instance.

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

exports.default = {
  Subscription: {
    // the subscription set up for direct messages. We first need to make sure that we have
    // the right permissions to allow directmessagesubscriptions. We then listen on the
    // NEW_DIRECT_MESSAGE channel to catch new messages. Also, the teamId of the payload should
    // match the teamId of the payload and the userId should match the sender/receiverid and same
    // for the user.id in the context.
    newDirectMessage: {
      subscribe: _permissions.directMessageSubscription.createResolver((0, _graphqlSubscriptions.withFilter)(() => _pubsub2.default.asyncIterator(NEW_DIRECT_MESSAGE), (payload, { teamId, userId }, { user }) => payload.teamId === teamId && (payload.senderId === user.id && payload.receiverId === userId || payload.senderId === userId && payload.receiverId === user.id)))
    }
  },
  DirectMessage: {
    // custom way of getting sender for the DirectMessage type.
    // if the sender exists in the parent, we just return, otherwise, we find the sender
    // by checking the user model where the id is the senderId in the parent.
    sender: ({ sender, senderId }, args, { models }) => {
      if (sender) {
        return sender;
      }
      return models.User.findOne({
        where: {
          id: senderId
        }
      });
    }
  },
  Query: {
    // the directMessage query that returns an array of DirectMessages.
    // we query the db to return the dms in ascending order with the where the teamId is the
    // current teamId and the sender is current user in context and receiver is the receiver is
    // the receiver in args or vice versa.
    directMessages: _permissions.requiresAuth.createResolver((() => {
      var _ref = _asyncToGenerator(function* (parent, { teamId, receiverId }, { models, user }) {
        return models.DirectMessage.findAll({
          order: [['created_at', 'ASC']],
          where: {
            teamId,
            [models.sequelize.Op.or]: [{
              [models.sequelize.Op.and]: [{ receiverId }, { senderId: user.id }]
            }, {
              [models.sequelize.Op.and]: [{ receiverId: user.id }, { senderId: receiverId }]
            }]
          }
        });
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })())
  },
  Mutation: {
    // the createDirectMessage mutation. We create a newdirectmessage using the args that we are
    // given (which includes the receiverId, text, teamId etc) and the senderId is the user.id of
    // the current user in context. We then use pubsub to publish this to the NEW_DIRECT_MESSAGE
    // and pass the teamId, senderId etc as the payload and return true.
    // in case of any errors, we just return false.
    createDirectMessage: _permissions.requiresAuth.createResolver((() => {
      var _ref2 = _asyncToGenerator(function* (parent, args, { models, user }) {
        try {
          const directMessage = yield models.DirectMessage.create(_extends({}, args, {
            senderId: user.id
          }));

          _pubsub2.default.publish(NEW_DIRECT_MESSAGE, {
            teamId: args.teamId,
            senderId: user.id,
            receiverId: args.receiverId,
            newDirectMessage: _extends({}, directMessage.dataValues, {
              sender: {
                username: user.username
              }
            })
          });

          return true;
        } catch (e) {
          return false;
        }
      });

      return function (_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      };
    })())
  }
};