// Here we define the resolvers for the Queries, Mutations etc
// we defined in the schema.

export default {
  Query: {
    hi: (parent, args, context, info) => 'hi',
  },
};
