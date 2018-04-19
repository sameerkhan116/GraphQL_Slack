import Sequelize from 'sequelize'; // Sequelize for creating the db.

// a sequelize function to connect with the db we created locally.
const sequelize = new Sequelize('graphql_slack', 'root', '12345', {
  dialect: 'postgres', // specifying the language of the database
  operatorsAliases: Sequelize.Op, // to remove the deprecation warning
  define: {
    underscored: true,
  },
});

// To create the db with the different models that we create
// This the db that will be exported and used in index.js when we do models.sequelize.sync.

const db = {
  User: sequelize.import('./user'),
  Channel: sequelize.import('./channel'),
  Message: sequelize.import('./message'),
  Team: sequelize.import('./team'),
};

// This is used to check if any of the models has association
// and associate them as needed.
Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

// attach the sequelize and Sequelize functions to db so that
// we can access them where we import this exported variable.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
