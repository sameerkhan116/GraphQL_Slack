export default (sequelize, DataTypes) => {
  // define new db table (user)
  const User = sequelize.define('user', {
    // required fields in the db.
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: DataTypes.STRING,
  });

  // here we define the associations in the db. In this case,
  // we define multiple users for one team through the member
  // table with foreign key: 'userId'
  User.associate = (models) => {
    User.belongsToMany(models.Team, {
      through: 'member',
      foreignKey: 'userId',
    });
  };

  return User;
};
