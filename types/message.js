// the message type has an ID, the text associated with it, the user who sent the message
// and the channel in which the message is.

export default `
   type Message {
    id: ID!
    text: String!
    user: User!
    channel: Channel!
  }

  type Mutation {
    createMessage(channelId: ID!, text: String!): Boolean!
  }
`;
