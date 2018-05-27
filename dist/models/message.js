'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// similar set up as user.js. Give the db name and required fields.
exports.default = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    text: DataTypes.STRING,
    url: DataTypes.STRING,
    filetype: DataTypes.STRING
  }, {
    indexes: [{
      fields: ['created_at']
    }]
  });

  // Each message in db is associated with a channel using a foreign key channelId.
  // Each message is associated to the user who wrote it.
  Message.associate = models => {
    // 1:M
    Message.belongsTo(models.Channel, { foreignKey: { name: 'channelId', field: 'channel_id' } });
    Message.belongsTo(models.User, { foreignKey: { name: 'userId', field: 'user_id' } });
  };

  return Message;
};