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
    messages: requiresAuth.createResolver(async (parent, { channelId }, { models, user }) => {
      const channel = await models.Channel.findOne({
        where: {
          id: channelId,
        },
      });

      if (!channel.public) {
        const member = await models.PCMember.findOne({
          raw: true,
          where: {
            channelId,
            userId: user.id,
          },
        });
        if (!member) {
          throw new Error('This is a private channel');
        }
      }

      return models.Message.findAll(
        { order: [['created_at', 'ASC']], where: { channelId } },
        { raw: true },
      );
    }),
  },
  Mutation: {
    createMessage:
      requiresAuth.createResolver(async (parent, { file, ...args }, { models, user }) => {
        try {
          const messageData = args;
          if (file) {
            messageData.filetype = file.type;
            messageData.url = file.path;
          }
          const messagePromise = models.Message.create({
            ...messageData,
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
    url: parent => (parent.url ? `http://localhost:3000/${parent.url}` : parent.url),
    user: async ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } });
    },
  },
};
