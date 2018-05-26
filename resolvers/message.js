// withFilter to filter and subscribe to the proper directMessages.
import { withFilter } from 'graphql-subscriptions';

// permission to check for authorization and if the members subscribed to the messages have
// access to the team.
import { requiresAuth, requiresTeamAccess } from '../permissions';
import pubsub from '../pubsub'; // redis pubsub

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
  Subscription: {
    // newChannelMessage subscription - check if members have teamAccess and check if the payload
    // channelId is the same as channelId passed as args.
    newChannelMessage: {
      subscribe: requiresTeamAccess.createResolver(withFilter(
        () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
        (payload, { channelId }) => payload.channelId === channelId,
      )),
    },
  },
  Query: {
    // query to get an array of messages.
    messages:
      requiresAuth.createResolver(async (parent, { cursor, channelId }, { models, user }) => {
        // find the channel where channelId is same as that passed in args.
        const channel = await models.Channel.findOne({
          where: {
            id: channelId,
          },
        });

        // the channel is private, check if the current user in the context is a member of this
        // channel if he isn't, throw an error.
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

        const options = {
          order: [['created_at', 'DESC']],
          where: { channelId },
          limit: 35,
        };

        if (cursor) {
          options.where.created_at = {
            [models.Sequelize.Op.lt]: cursor,
          };
        }

        // otherwise, return the message in ascending order where the messages have the same
        // channelId as that passed in args.
        return models.Message.findAll(
          options,
          { raw: true },
        );
      }),
  },
  Mutation: {
    // the createMessage mutation.
    createMessage:
      requiresAuth.createResolver(async (parent, { file, ...args }, { models, user }) => {
        try {
          // we get the messagedata from the args (channelid, text, file)
          const messageData = args;
          // if the data is a file, then we get the filetype and filepath from it.
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

          // we then create a new message in the messagemodel and find the user associated with the
          // message using the user.id in the context.
          const [message, currentUser] = await Promise.all([messagePromise, userPromise]);

          // we publish this message so that it can read in the subscription with the channelId
          // and mesasge as the payload, and return true.
          pubsub.publish(NEW_CHANNEL_MESSAGE, {
            channelId: args.channelId,
            newChannelMessage: { ...message.dataValues, user: currentUser },
          });

          return true;
        } catch (err) {
          // in case of errors, we return false.
          console.log(err);
          return false;
        }
      }),
  },
  Message: {
    // url for the message type. WE do this so that everytime, we try to access the file, we don't
    // need to prepend the site url.
    url: parent => (parent.url ? `http://localhost:3000/${parent.url}` : parent.url),
    user: async ({ user, userId }, args, { models }) => {
      if (user) {
        return user;
      }
      return models.User.findOne({ where: { id: userId } });
    },
  },
};
