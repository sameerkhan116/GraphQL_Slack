// same set up as user.js
export default(sequelize, DataTypes) => {
  const Channel = sequelize.define('channel', { name: DataTypes.STRING, public: DataTypes.BOOLEAN });

  // each channel belongs to a team and is connected with foreign key: teamId
  Channel.associate = (models) => {
    // 1:M
    Channel.belongsTo(models.Team, { foreignKey: 'teamId' });
  };

  return Channel;
};
