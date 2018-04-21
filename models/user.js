import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
  // define new db table (user)
  const User = sequelize.define('user', {
    // required fields in the db.
    username: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isAlphanumeric: {
          args: true,
          msg: 'The username can only contain letters and numbers',
        },
        len: {
          args: [3, 25],
          msg: 'The username needs to be between 3 and 25 characters long',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: {
          args: true,
          msg: 'Invalid email',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [5, 100],
          msg: 'The password need to be between 5 and 100 characters long',
        },
      },
    },
  }, {
    hooks: {
      afterValidate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
    },
  });

  // here we define the associations in the db. In this,
  // we define multiple users for one team through the member
  // table with foreign key: 'userId'
  User.associate = (models) => {
    User.belongsToMany(models.Team, {
      through: 'member',
      foreignKey: { name: 'userId', field: 'user_id' },
    });
    User.belongsToMany(models.Channel, {
      through: 'channel_member',
      foreignKey: {
        name: 'userId',
        field: 'user_id',
      },
    });
  };

  return User;
};
