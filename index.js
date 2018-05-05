import express from 'express'; // for setting up the server.
import bodyParser from 'body-parser'; // to parse the messages in form body.
import { graphqlExpress } from 'apollo-server-express'; // for setting up the /graphql endpoint with the schema.
import { makeExecutableSchema } from 'graphql-tools'; // to create the schema with the type definitions and resolvers that we write.
import expressPlayground from 'graphql-playground-middleware-express'; // to test our queries and resolvers. Similar to graphiql.
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas'; // for modularizing our graphql types.
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import path from 'path'; // for specifying the dirname to types and resolvers
import cors from 'cors'; // for cross origin resource sharing
import 'colors'; // for adding colors to the terminal.

import models from './models'; // the DB models we setup using psql and sequelize.
import { addUser } from './addUser';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './types'))); // // merege all modularized types
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers'))); // merege all modularized resolvers
const PORT = 3000; // port on which our app is running.
const app = express(); // app - an executable server using express.
const server = createServer(app);
const endpoint = '/graphql'; // our graphql enpoint
export const SECRET = 'kdshakdjlasdjaskdj'; // required for login authentication
export const SECRET2 = 'dasldkasldkashasjd'; // required for login authentication
// the schema we create by passing the typedefs and their resolvers.
const schema = makeExecutableSchema({ typeDefs, resolvers });
// setting up the /graphql endpoint with graphqlExpress that requires the schema.
app.use(cors('*'));
app.use(addUser); // use the add user middleware to attach user to req.
app.use(endpoint, bodyParser.json(), graphqlExpress(req => ({
  schema,
  context: {
    models, // attach the models (db)
    user: req.user, // attach the user from addUser middleware
    SECRET,
    SECRET2,
  },
})));
app.use('/playground', expressPlayground({ endpoint })); // the playground enpoint for testing graphql queries and mutations.

// before running the server, we need to sync the db models that we created with sequelize.
// this returns a promise. When it is resolved, we can start the server.
models.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    // eslint-disable-next-line
    new SubscriptionServer({
      execute,
      subscribe,
      schema,
    }, {
      server,
      path: '/subscriptions',
    });
    console.log(`Listening on http://localhost:${PORT}`.yellow.underline);
  });
});
