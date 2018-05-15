// the channel type returns an id, name, public boolean value, messages in the channel
// (which is an array), and the users in the channel which is an array of users.
// the mutation available on channel is createChannel.

export default `
  type Channel {
    id: Int!
    name: String!
    public: Boolean!
    messages: [Message!]!
    users: [User!]!
  }

  type ChannelResponse {
    ok: Boolean!
    channel: Channel
    errors: [Error!]
  }

  type Mutation {
    createChannel(teamId: Int!, name: String!, public: Boolean=false, members: [Int!]=[]): ChannelResponse!
  }
`;
