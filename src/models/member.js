// the member model for public channels. helps in identifying if the user of the channel
// is an admin or not.
export default (sequelize, DataTypes) => {
  const Member = sequelize.define('member', {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Member;
};

