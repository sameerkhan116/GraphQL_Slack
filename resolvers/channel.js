import formatErrors from '../formatErrors'; // for formatting the sequelize validation errors
import { requiresAuth } from '../permissions'; // for only allowing authorized users

export default {
  Mutation: {
    // the getOrCreateChannel mutation used for creating a channel for direct messaging. If
    // we already have a channel for the person or group that we want to talk to, then we
    // get the channel otherwise we create the channel.
    getOrCreateChannel:
      requiresAuth.createResolver(async (parent, { teamId, members }, { models, user }) => {
        // check if the current user is a part of this team where we want to create the channel.
        const member = await models.Member.findOne({
          where: {
            teamId,
            userId: user.id,
          },
        });

        // if such a member is not found, throw an error.
        if (!member) {
          throw new Error('Not authorized');
        }

        // otherwise add current user to array of all members that we receive as args.
        // get the data from the sequelize query (sequelize query returns two things - current data
        // and results). In the query, we get the channelId and channelName where the
        // privateChannelId is the channelId and the dm type for the channel is true. Also, the
        // channel should be a part of the same team. Finally, the members of the channel and the
        // number of members should be the same as the length of allMembers array.
        const allMembers = [...members, user.id];
        const [data] = await models.sequelize.query(`
          SELECT c.id, c.name
          FROM channels AS c, pcmembers AS PC
          WHERE pc.channel_id = c.id AND c.dm = true AND c.public = false AND c.team_id = ${teamId}
          GROUP BY c.id, c.name
          HAVING array_agg(pc.user_id) @> Array[${allMembers.join(',')}] AND count(pc.user_id) = ${allMembers.length}
        `, {
          raw: true,
        });

        // if such a channel is found, return it.
        if (data.length) {
          return data[0];
        }

        // otherwise, we create a new channel by first finding the users.
        const users = await models.User.findAll({
          where: {
            id: {
              [models.sequelize.Op.in]: members,
            },
          },
        });

        // we then map over these users and join them into an array by there username
        const name = users.map(u => u.username).join(', ');

        // finally, we do a transactions where we first create a channel with type public false
        // and dm true. We also map the allMembers with userId and channelId and add all of them to
        // the PCmembers tables simoultaneously. We then return the channelId.
        const response = await models.sequelize.transaction(async (transaction) => {
          const channel = await models.Channel.create({
            name,
            public: false,
            dm: true,
            teamId,
          }, { transaction });

          const channelId = channel.dataValues.id;
          const pcmembers = allMembers.map(m => ({ userId: m, channelId }));
          await models.PCMember.bulkCreate(pcmembers, { transaction });
          return channelId;
        });

        // finally, we return the channelId and the name of the channel that was created above.
        return {
          id: response,
          name,
        };
      }),

    // the createChannel mutation is for creating a regular channel. This also requires auth.
    createChannel: requiresAuth.createResolver(async (parent, args, { models, user }) => {
      try {
        // check if the current member is a part of the same team.
        const member = await models.Member.findOne({
          where: {
            teamId: args.teamId,
            userId: user.id,
          },
        });

        // if this member is not an admin, then we can just return false and pass the error.
        if (!member.admin) {
          return {
            ok: false,
            errors: [{
              path: 'name',
              message: 'You have to be owener of the team to create channels',
            }],
          };
        }

        // otherwise, we create a transaction: first we create a channel with the given args
        const response = await models.sequelize.transaction(async (transaction) => {
          const channel = await models.Channel.create(args, { transaction });
          // if the channel we are trying to create is not public, we remove the current userId
          // from the members array that is passed in the args and manually push (to ensure)
          // that no duplicates are added. We then map these members according to the userId and
          // channelId and add them in bulk to the pcMembers table.
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

        // we can then return the channel that we created and an ok response.
        return {
          ok: true,
          channel: response,
        };
      } catch (err) {
        // in case of any errors, we return ok false and the errors properly formatted.
        console.log(err);
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    }),
  },
};
