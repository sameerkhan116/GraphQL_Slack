import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for checking if user available in context

export default {
  Query: {
    allTeams: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.Team.findAll({ owner: user.id }, { raw: true })),
  },
  Mutation: {
    // the create team mutation - uses the models and the user passed in context to create a team
    // and return a response corresponding to the creatTeamResponse in the schema.
    createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        await models.Team.create({ ...args, owner: user.id });
        return {
          ok: true,
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
  Team: {
    channels: ({ id }, args, { models }) => models.Channel.findAll({ teamId: id }),
  },
};
