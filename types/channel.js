// the channel type returns an id, name, public boolean value, messages in the channel
// (which is an array), and the users in the channel which is an array of users.
// the mutation available on channel is createChannel.

export default `
  type Channel {
    id: Int!
    name: String!
    public: Boolean
    messages: [Message!]!
    users: [User!]!
  }

  type Mutation {
    createChannel(teamId: Int!, name: String!, public: Boolean=false): Boolean!
  }
`;
