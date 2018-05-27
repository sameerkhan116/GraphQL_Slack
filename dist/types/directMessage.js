"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = `
  type DirectMessage {
    id: Int!
    text: String!
    sender: User!
    receiverId: Int!
    created_at: String!
  }

  type Query {
    directMessages(teamId: Int!, receiverId: Int!): [DirectMessage!]!
  }

  type Subscription {
    newDirectMessage(teamId: Int!, userId: Int!): DirectMessage!
  }

  type Mutation {
    createDirectMessage(receiverId: Int!, text: String!, teamId: Int!): Boolean!
  }
`;