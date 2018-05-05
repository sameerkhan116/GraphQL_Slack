// the message type has an ID, the text associated with it, the user who sent the message
// and the channel in which the message is.

export default `
   type Message {
    id: Int!
    text: String!
    user: User!
    channel: Channel!
    created_at: String!
  }

  type Query {
    messages(channelId: Int!): [Message!]!
  }

  type Mutation {
    createMessage(channelId: Int!, text: String!): Boolean!
  }
`;
