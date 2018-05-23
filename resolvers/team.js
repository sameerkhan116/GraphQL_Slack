import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for checking if user available in context

export default {
  Query: {
    // the getTeamMembers query. here we select the team members where the teamId is the teamId
    // passed in args and also, select the current user.
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
    // and return a response corresponding to the creatTeamResponse in the schema. Alost add the
    // current creator of the team as member with admin true.
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
        // incase of errors, we return false
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    }),
    // the add member mutation. We first find the member in the members table and then add the
    // user to be added to the user table.
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
        // if the current member trying to add the user is not an admin, we can return false
        if (!member.admin) {
          return {
            ok: false,
            errors: [{ path: 'admin', message: 'You cannot add members to the team' }],
          };
        }
        // else if the userToAdd doesn't exist, that is there is no member with that email, we
        // return false, otherwise we add this user to the members table.
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
    // to get the channels for the team, we use this query - join channel with pcMembers where
    // channelId is the pcmembers.channel_id. We search where current team is the teamId passed
    // in args and the channel is public or pc.user_id is the same as the id of the user in context.
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
    // to get theh directMessageMembers, we join the users table with the dm table. The user id
    // should match the sender or receiver id in the dm table and the team should match the teamId
    // in the parent.
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
