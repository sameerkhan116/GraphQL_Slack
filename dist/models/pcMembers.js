'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// the private channel member just needed to create associations.
exports.default = sequelize => {
  const PCMember = sequelize.define('pcmember', {});
  return PCMember;
};