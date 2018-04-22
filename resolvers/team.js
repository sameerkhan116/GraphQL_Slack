import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors

export default {
  Mutation: {
    // the create team mutation - uses the models and the user passed in context to create a team
    // and return a response corresponding to the creatTeamResponse in the schema.
    createTeam: async (parent, args, { models, user }) => {
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
    },
  },
};
