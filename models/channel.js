// same set up as user.js
export default(sequelize, DataTypes) => {
  const Channel = sequelize.define('channel', {
    name: DataTypes.STRING,
    public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  // each channel belongs to a team and is connected with foreign key: teamId
  Channel.associate = (models) => {
    // 1:M
    Channel.belongsTo(models.Team, { foreignKey: { name: 'teamId', field: 'team_id' } });
    Channel.belongsToMany(models.User, {
      through: 'channel_member',
      foreignKey: {
        name: 'channelId',
        field: 'channel_id',
      },
    });
  };

  return Channel;
};
