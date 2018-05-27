'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// the member model for public channels. helps in identifying if the user of the channel
// is an admin or not.
exports.default = (sequelize, DataTypes) => {
  const Member = sequelize.define('member', {
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return Member;
};