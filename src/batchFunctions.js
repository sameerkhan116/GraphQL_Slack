export const channelBatcher = async (ids, models, user) => {
  const results = await models.sequelize.query(`
    SELECT DISTINCT ON (id) * 
    FROM channels AS c LEFT OUTER JOIN pcmembers AS pc
    ON c.id = pc.channel_id
    WHERE c.team_id in (:teamIds) AND (c.public = true OR pc.user_id = :userId)`, {
    replacements: {
      teamIds: ids,
      userId: user.id,
    },
    model: models.Channel,
    raw: true,
  });

  const data = {};

  results.forEach((r) => {
    if (data[r.team_id]) {
      data[r.team_id].push(r);
    } else {
      data[r.team_id] = [r];
    }
  });

  console.log(data);

  return ids.map(id => data[id]);
};

