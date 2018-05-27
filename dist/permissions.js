'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// The create user function takes a resolver which then creates another function
// and a child resolver. The base resolver is then resolved and if it succeeds, then
// the child resolver is returned.
const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = (() => {
      var _ref = _asyncToGenerator(function* (parent, args, context, info) {
        yield resolver(parent, args, context, info);
        return childResolver(parent, args, context, info);
      });

      return function newResolver(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    })();
    return createResolver(newResolver);
  };
  return baseResolver;
};

// the requiresAuth function - that can be run before any other function to check
// if the user is available in the context in the resolver function.
const requiresAuth = exports.requiresAuth = createResolver((parent, args, { user }) => {
  if (!user || !user.id) {
    throw new Error('Not authenticated');
  }
});

// another permission to check if the user in context is a member of the team that the channel
// is a part of. If such a member exists, then we are good, otherwise, we throw an error.
const requiresTeamAccess = exports.requiresTeamAccess = createResolver((() => {
  var _ref2 = _asyncToGenerator(function* (parent, { channelId }, { models, user }) {
    if (!user || !user.id) {
      throw new Error('Not authenticated!');
    }

    const channel = yield models.Channel.findOne({
      where: {
        id: channelId
      }
    });
    const member = yield models.Member.findOne({
      where: {
        teamId: channel.teamId,
        userId: user.id
      }
    });
    if (!member) {
      throw new Error('You have to be a member of this team to subscribe to its messages.');
    }
  });

  return function (_x5, _x6, _x7) {
    return _ref2.apply(this, arguments);
  };
})());

// the directMessageSubscription permission so that unauthorized users are not able to access
// message subscriptions. if there is no user or user.id in context then we can straight away
// throw an error. Otherwise, we check if the userId in the args or the user.id of the user
// in context is a part of the team that we are in right now. If this is not the case, then we
// throw a new error saying something went wrong.
const directMessageSubscription = exports.directMessageSubscription = createResolver((() => {
  var _ref3 = _asyncToGenerator(function* (parent, { teamId, userId }, { models, user }) {
    if (!user || !user.id) {
      throw new Error('Not Authenticated');
    }

    const members = yield models.Member.findAll({
      where: {
        teamId,
        [models.sequelize.Op.or]: [{ userId }, { userId: user.id }]
      }
    });

    if (members.length !== 2) {
      throw new Error('Something went wrong');
    }
  });

  return function (_x8, _x9, _x10) {
    return _ref3.apply(this, arguments);
  };
})());