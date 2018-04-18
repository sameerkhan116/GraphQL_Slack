import express from 'express'; // for setting up the server.
import bodyParser from 'body-parser'; // to parse the messages in form body.
import { graphqlExpress } from 'apollo-server-express'; // for setting up the /graphql endpoint with the schema.
import { makeExecutableSchema } from 'graphql-tools'; // to create the schema with the type definitions and resolvers that we write.
import expressPlayground from 'graphql-playground-middleware-express'; // to test our queries and resolvers. Similar to graphiql.
import 'colors'; // for adding colors to the terminal.

import typeDefs from './apollo/schema'; // the type definitions such as queries, custom Types etc.
import resolvers from './apollo/resolvers'; // for resolving the queries, mutations etc. in typedefs.
import models from './models'; // the DB models we setup using psql and sequelize.

const PORT = 3000; // port on which our app is running.
const app = express(); // app - an executable server using express.
const endpoint = '/graphql'; // our graphql enpoint
// the schema we create by passing the typedefs and their resolvers.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// setting up the /graphql endpoint with graphqlExpress that requires the schema.
app.use(endpoint, bodyParser.json(), graphqlExpress({ schema }));
app.use('/playground', expressPlayground({ endpoint })); // the playground enpoint for testing graphql queries and mutations.

// before running the server, we need to sync the db models that we created with sequelize.
// this returns a promise. When it is resolved, we can start the server.
models.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`.underline.yellow);
  });
});
