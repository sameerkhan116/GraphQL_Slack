import { tryLogin } from '../auth'; // for login mutations
import formatErrors from '../formatErrors'; // for formatting sequelize validation errors
import { requiresAuth } from '../permissions'; // for checking if user available in context

export default {
  // simple queries where we just find the requested users in the db
  Query: {
    me: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.User.findOne({ where: { id: user.id } })),
    getUser: requiresAuth.createResolver((parent, { userId }, { models }) =>
      models.User.findOne({ where: { id: userId } })),
    allUsers: (parent, args, { models }) => models.User.findAll(),
  },
  // the login mutation to try login using the strat defined in auth.js
  // the register mutation to create the user. Returns a response of type RegisterResponse.
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLogin(email, password, models, SECRET, SECRET2),
    register: async (parent, args, { models }) => {
      try {
        const user = await models.User.create(args);
        return {
          ok: true,
          user,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
  User: {
    // to get the teams for the user, we join the members and teams table on the teamId and where
    // the userId is the id of the user in context.
    teams: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.sequelize.query('SELECT * FROM teams JOIN members ON id = team_id WHERE user_id = ?', {
        replacements: [user.id],
        model: models.Team,
        raw: true,
      })),
  },
};
