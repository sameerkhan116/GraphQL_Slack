// similar set up as user.js with required fields and db name
export default(sequelize, DataTypes) => {
  const Team = sequelize.define('team', {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  // A user can be a member of many teams and also, only one user can be the owner
  // of a particular team which is what is specified in these associations.
  Team.associate = (models) => {
    // N:M
    Team.belongsToMany(models.User, {
      through: 'member',
      foreignKey: { name: 'teamId', field: 'team_id' },
    });
    // 1:M
    Team.belongsTo(models.User, {
      foreignKey: 'owner',
    });
  };

  return Team;
};
