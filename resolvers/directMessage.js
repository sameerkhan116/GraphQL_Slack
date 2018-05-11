import { withFilter } from 'graphql-subscriptions';

import { requiresAuth, directMessageSubscription } from '../permissions';
import pubsub from '../pubsub';

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

export default {
  Subscription: {
    newDirectMessage: {
      subscribe: directMessageSubscription.createResolver(withFilter(
        () => pubsub.asyncIterator(NEW_DIRECT_MESSAGE),
        (payload, { teamId, userId }, { user }) => (payload.teamId === teamId) &&
          ((payload.senderId === user.id && payload.receiverId === userId) ||
          (payload.senderId === userId && payload.receiverId === user.id)),
      )),
    },
  },
  DirectMessage: {
    sender: ({ sender, senderId }, args, { models }) => {
      if (sender) {
        return sender;
      }
      return models.User.findOne({
        where: {
          id: senderId,
        },
      });
    },
  },
  Query: {
    directMessages:
      requiresAuth.createResolver(async (parent, { teamId, receiverId }, { models, user }) =>
        models.DirectMessage.findAll({
          order: [['created_at', 'ASC']],
          where: {
            teamId,
            [models.sequelize.Op.or]: [{
              [models.sequelize.Op.and]: [{ receiverId }, { senderId: user.id }],
            }, {
              [models.sequelize.Op.and]: [{ receiverId: user.id }, { senderId: receiverId }],
            }],
          },
        })),
  },
  Mutation: {
    createDirectMessage: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const directMessage = await models.DirectMessage.create({
          ...args,
          senderId: user.id,
        });

        pubsub.publish(NEW_DIRECT_MESSAGE, {
          teamId: args.teamId,
          senderId: user.id,
          receiverId: args.receiverId,
          newDirectMessage: {
            ...directMessage.dataValues,
            sender: {
              username: user.username,
            },
          },
        });

        return true;
      } catch (e) {
        return false;
      }
    }),
  },
};
