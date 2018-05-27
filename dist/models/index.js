'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Sequelize for creating the db.

// a sequelize function to connect with the db we created locally.
const sequelize = new _sequelize2.default(process.env.TEST_DB || 'graphql_slack', 'root', '12345', {
  dialect: 'postgres', // specifying the language of the database
  operatorsAliases: _sequelize2.default.Op, // to remove the deprecation warning
  host: process.env.DB_HOST || 'localhost',
  define: {
    underscored: true
  }
});

// To create the db with the different models that we create
// This the db that will be exported and used in index.js when we do models.sequelize.sync.

const db = {
  User: sequelize.import('./user'),
  Channel: sequelize.import('./channel'),
  Message: sequelize.import('./message'),
  Team: sequelize.import('./team'),
  Member: sequelize.import('./member'),
  DirectMessage: sequelize.import('./directMessage'),
  PCMember: sequelize.import('./pcMembers')
};

// This is used to check if any of the models has association
// and associate them as needed.
Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

// attach the sequelize and Sequelize functions to db so that
// we can access them where we import this exported variable.
db.sequelize = sequelize;
db.Sequelize = _sequelize2.default;

exports.default = db;