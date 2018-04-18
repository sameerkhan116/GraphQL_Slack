// similar set up as user.js. Give the db name and required fields.
export default(sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    text: DataTypes.STRING,
  });

  // Each message in db is associated with a channel using a foreign key channelId.
  // Each message is associated to the user who wrote it.
  Message.associate = (models) => {
    // 1:M
    Message.belongsTo(models.Channel, { foreignKey: 'channelId' });
    Message.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Message;
};
