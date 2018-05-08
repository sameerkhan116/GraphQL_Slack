import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for formatting the sequelize validation errors

export default {
  Mutation: {
    createChannel: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const member = await models.Member.findOne({
          where: {
            teamId: args.teamId,
            userId: user.id,
          },
        });
        if (!member.admin) {
          return {
            ok: false,
            errors: [{
              path: 'name',
              message: 'You have to be owener of the team to create channels',
            }],
          };
        }
        const channel = await models.Channel.create(args);
        return {
          ok: true,
          channel,
        };
      } catch (err) {
        console.log(err);
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    }),
  },
};
