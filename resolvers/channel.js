import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for formatting the sequelize validation errors

export default {
  Mutation: {
    getOrCreateChannel: requiresAuth.createResolver(async (parent, { teamId, members }, { models, user }) => {
      members.push(user.id);
      const [data, result] = await models.sequelize.query(`
        SELECT c.id
        FROM channels AS c, pcmembers AS PC
        WHERE pc.channel_id = c.id AND c.dm = true AND c.public = false AND c.team_id = ${teamId}
        GROUP BY c.id
        HAVING array_agg(pc.user_id) @> Array[${members.join(',')}] AND count(pc.user_id) = ${members.length}
      `, {
        raw: true,
      });

      if (data.length) {
        return data[0].id;
      }

      const response = await models.sequelize.transaction(async (transaction) => {
        const channel = await models.Channel.create({
          name: 'Hello',
          public: false,
          dm: true,
          teamId,
        }, { transaction });

        const channelId = channel.dataValues.id;
        const pcmembers = members.map(m => ({ userId: m, channelId }));
        await models.PCMember.bulkCreate(pcmembers, { transaction });
        return channelId;
      });

      return response;
    }),
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

        const response = await models.sequelize.transaction(async (transaction) => {
          const channel = await models.Channel.create(args, { transaction });
          if (!args.public) {
            const members = args.members.filter(m => m !== user.id);
            members.push(user.id);
            const pcmembers = members.map(m => ({
              userId: m,
              channelId: channel.dataValues.id,
            }));
            await models.PCMember.bulkCreate(pcmembers, { transaction });
          }
          return channel;
        });

        return {
          ok: true,
          channel: response,
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
