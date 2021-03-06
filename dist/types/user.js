"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// the User type contains an ID, a username, an email and the teams he/she are a part of.
// the queries available for users - getUser(with an id) or allusers.
// the register response gives an ok boolean value, the user and the errors if any.
// similarly, the login response returns an ok boolean along with the token and refreshToken
// or any errors.
// the mutations available on user are login and register.

exports.default = `
  type User {
    id: Int!
    username: String!
    email: String!
    teams: [Team!]!
  }

  type Query {
    me: User!
    allUsers: [User!]!
    getUser(userId: Int!): User
  }
  
  type RegisterResponse {
    ok: Boolean!
    user: User
    errors: [Error!]
  }

  type LoginResponse {
    ok: Boolean!
    token: String
    refreshToken: String
    errors: [Error!]
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): RegisterResponse!
    login(email: String!, password: String!): LoginResponse!
  }
`;