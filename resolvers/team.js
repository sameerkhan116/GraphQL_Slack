import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for checking if user available in context

export default {
  Query: {
    allTeams: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.Team.findAll({ where: { owner: user.id } }, { raw: true })),
  },
  Mutation: {
    // the create team mutation - uses the models and the user passed in context to create a team
    // and return a response corresponding to the creatTeamResponse in the schema.
    createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const team = await models.Team.create({ ...args, owner: user.id });
        await models.Channel.create({ name: 'general', public: true, teamId: team.id });
        return {
          ok: true,
          team,
        };
      } catch (err) {
        console.log(err);
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    }),
    addMember: requiresAuth.createResolver(async (parent, { email, teamId }, { models, user }) => {
      try {
        const teamPromise = models.Team.findOne({ where: { id: teamId } });
        const userToAddPromise = models.User.findOne({ where: { email } });
        const [team, userToAdd] = await Promise.all([teamPromise, userToAddPromise]);
        if (team.owner !== user.id) {
          return {
            ok: false,
            errors: [{ path: 'email', message: 'You cannot add members to the team' }],
          };
        }
        if (!userToAdd) {
          return {
            ok: false,
            errors: [{ path: 'email', message: 'Could not find that email' }],
          };
        }
        await models.Member.create({ userId: userToAdd.id, teamId });
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
    channels: ({ id }, args, { models }) => models.Channel.findAll({ where: { teamId: id } }),
  },
};
