export default `
  type Channel {
    id: ID!
    name: String!
    public: Boolean
    messages: [Message!]!
    user: [User!]!
  }

  type Mutation {
    createChannel(teamId: ID!, name: String!, public: Boolean=false): Boolean!
  }
`;
