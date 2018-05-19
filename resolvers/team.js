import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for checking if user available in context

export default {
  Query: {
    getTeamMembers: requiresAuth.createResolver(async (parent, { teamId }, { models }) =>
      models.sequelize.query(
        'SELECT * FROM users JOIN members on members.user_id = users.id where members.team_id = ?',
        {
          replacements: [teamId],
          model: models.User,
          raw: true,
        },
      )),
  },
  Mutation: {
    // the create team mutation - uses the models and the user passed in context to create a team
    // and return a response corresponding to the creatTeamResponse in the schema.
    createTeam: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        const response = await models.sequelize.transaction(async (transaction) => {
          const team = await models.Team.create({ ...args }, { transaction });
          await models.Member.create(
            { admin: true, teamId: team.id, userId: user.id },
            { transaction },
          );
          await models.Channel.create(
            { name: 'general', public: true, teamId: team.id },
            { transaction },
          );
          return team;
        });
        return {
          ok: true,
          team: response,
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
        const memberPromise = models.Member.findOne({
          where: {
            userId: user.id,
            teamId,
          },
        });
        const userToAddPromise = models.User.findOne({ where: { email } });
        const [member, userToAdd] = await Promise.all([memberPromise, userToAddPromise]);
        if (!member.admin) {
          return {
            ok: false,
            errors: [{ path: 'admin', message: 'You cannot add members to the team' }],
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
    channels: ({ id }, args, { models, user }) =>
      models.sequelize.query(`
        SELECT DISTINCT ON (id) * 
        FROM channels AS c LEFT OUTER JOIN pcmembers AS pc
        ON c.id = pc.channel_id
        WHERE c.team_id = :teamId AND (c.public = true OR pc.user_id = :userId)`, {
        replacements: {
          teamId: id,
          userId: user.id,
        },
        model: models.Channel,
        raw: true,
      }),
    directMessageMembers: ({ id }, args, { models, user }) =>
      models.sequelize.query(`
        SELECT DISTINCT on (u.id) u.id, u.username 
        FROM users AS u JOIN direct_messages AS dm 
        ON (u.id = dm.sender_id OR u.id = dm.receiver_id) 
        WHERE (:currentUserId=dm.receiver_id OR :currentUserId = dm.sender_id) AND dm.team_id = :teamId`, {
        replacements: {
          currentUserId: user.id,
          teamId: id,
        },
        model: models.User,
        raw: true,
      }),
  },
};
