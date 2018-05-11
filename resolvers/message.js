import { withFilter } from 'graphql-subscriptions';

import { requiresAuth, requiresTeamAccess } from '../permissions';
import pubsub from '../pubsub';

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
  Subscription: {
    newChannelMessage: {
      subscribe: requiresTeamAccess.createResolver(withFilter(
        () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
        (payload, { channelId }) => payload.channelId === channelId,
      )),
    },
  },
  Query: {
    messages: requiresAuth.createResolver((parent, { channelId }, { models }) =>
      models.Message.findAll(
        { order: [['created_at', 'ASC']], where: { channelId } },
        { raw: true },
      )),
  },
  Mutation: {
    createMessage: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const messagePromise = models.Message.create({
          ...args,
          userId: user.id,
        });

        const userPromise = models.User.findOne({
          where: {
            id: user.id,
          },
        });

        const [message, currentUser] = await Promise.all([messagePromise, userPromise]);

        pubsub.publish(NEW_CHANNEL_MESSAGE, {
          channelId: args.channelId,
          newChannelMessage: { ...message.dataValues, user: currentUser },
        });

        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    }),
  },
  Message: {
    user: async ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } });
    },
  },
};
