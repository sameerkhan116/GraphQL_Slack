import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import expressPlayground from 'graphql-playground-middleware-express';
import colors from 'colors';

import typeDefs from './apollo/schema';
import resolvers from './apollo/resolvers';

const PORT = 3000;
const app = express();
const schema = makeExecutableSchema({ typeDefs, resolvers });

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/playground', expressPlayground({ endpoint: '/graphql' }));

app.listen(PORT, () => {
  console.log(colors.underline.yellow(`Running on http://localhost:${PORT}`));
});
