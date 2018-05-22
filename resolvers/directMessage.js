// the withFilter function from graphql-subscriptions to filter unnecessary messages
import { withFilter } from 'graphql-subscriptions';

// the requiresAuth and directMessageSubscription permission to make sure only authorized
// people access the messages.
import { requiresAuth, directMessageSubscription } from '../permissions';
import pubsub from '../pubsub'; // the redis pubsub instance.

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

export default {
  Subscription: {
    // the subscription set up for direct messages. We first need to make sure that we have
    // the right permissions to allow directmessagesubscriptions. We then listen on the
    // NEW_DIRECT_MESSAGE channel to catch new messages. Also, the teamId of the payload should
    // match the teamId of the payload and the userId should match the sender/receiverid and same
    // for the user.id in the context.
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
    // custom way of getting sender for the DirectMessage type.
    // if the sender exists in the parent, we just return, otherwise, we find the sender
    // by checking the user model where the id is the senderId in the parent.
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
    // the directMessage query that returns an array of DirectMessages.
    // we query the db to return the dms in ascending order with the where the teamId is the
    // current teamId and the sender is current user in context and receiver is the receiver is
    // the receiver in args or vice versa.
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
    // the createDirectMessage mutation. We create a newdirectmessage using the args that we are
    // given (which includes the receiverId, text, teamId etc) and the senderId is the user.id of
    // the current user in context. We then use pubsub to publish this to the NEW_DIRECT_MESSAGE
    // and pass the teamId, senderId etc as the payload and return true.
    // in case of any errors, we just return false.
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
