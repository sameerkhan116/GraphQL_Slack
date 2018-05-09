import { requiresAuth } from '../permissions';

export default {
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
        console.log(directMessage);
        return true;
      } catch (e) {
        return false;
      }
    }),
  },
};
