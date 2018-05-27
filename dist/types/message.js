"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// the message type has an ID, the text associated with it, the user who sent the message
// and the channel in which the message is.

exports.default = `
   type Message {
    id: Int!
    text: String
    user: User!
    channel: Channel!
    created_at: String!
    url: String
    filetype: String
  }

  input File {
    type: String!
    path: String!
  }

  type Subscription {
    newChannelMessage(channelId: Int!): Message!
  }

  type Query {
    messages(cursor: String, channelId: Int!): [Message!]!
  }

  type Mutation {
    createMessage(channelId: Int!, text: String, file: File): Boolean!
  }
`;