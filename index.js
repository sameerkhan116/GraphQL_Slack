import express from 'express'; // for setting up the server.
import bodyParser from 'body-parser'; // to parse the messages in form body.
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'; // for setting up the /graphql endpoint with the schema.
import { makeExecutableSchema } from 'graphql-tools'; // to create the schema with the type definitions and resolvers that we write.
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas'; // for modularizing our graphql types.
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import jwt from 'jsonwebtoken';
import path from 'path'; // for specifying the dirname to types and resolvers
import cors from 'cors'; // for cross origin resource sharing
import 'colors'; // for adding colors to the terminal.

import models from './models'; // the DB models we setup using psql and sequelize.
import { addUser } from './addUser';
import { refreshTokens } from './auth'; // required for refreshing tokens
import fileUpload from './fileMiddleware';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './types'))); // // merege all modularized types
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, './resolvers'))); // merege all modularized resolvers
const PORT = 3000; // port on which our app is running.
const app = express(); // app - an executable server using express.
const server = createServer(app);
const endpointURL = '/graphql'; // our graphql enpoint
const subscriptionsEndpoint = `ws://localhost:${PORT}/subscriptions`;
export const SECRET = 'kdshakdjlasdjaskdj'; // required for login authentication
export const SECRET2 = 'dasldkasldkashasjd'; // required for login authentication
// the schema we create by passing the typedefs and their resolvers.
const schema = makeExecutableSchema({ typeDefs, resolvers });
// setting up the /graphql endpoint with graphqlExpress that requires the schema.
app.use(cors('*'));
app.use(addUser); // use the add user middleware to attach user to req.
app.use(endpointURL, bodyParser.json(), fileUpload, graphqlExpress(req => ({
  schema,
  context: {
    models, // attach the models (db)
    user: req.user, // attach the user from addUser middleware
    SECRET,
    SECRET2,
  },
})));
app.use('/graphiql', graphiqlExpress({
  endpointURL,
  subscriptionsEndpoint,
}));
app.use('/files', express.static('files'));

// before running the server, we need to sync the db models that we created with sequelize.
// this returns a promise. When it is resolved, we can start the server.
models.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    // eslint-disable-next-line
    new SubscriptionServer({
      execute,
      subscribe,
      schema,
      // eslint-disable-next-line
      onConnect: async ({ token, refreshToken }, webSocket) => {
        if (token && refreshToken) {
          try {
            const { user } = jwt.verify(token, SECRET);
            // eslint-disable-next-line
            return {
              models,
              user,
            };
          } catch (err) {
            const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
            // eslint-disable-next-line
            return {
              models,
              user: newTokens.user,
            };
          }
        }
        return {};
      },
    }, {
      // the endpoint for subscriptions
      server,
      path: '/subscriptions',
    });
    console.log(`Listening on http://localhost:${PORT}`.yellow.underline);
  });
});
