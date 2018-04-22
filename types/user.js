// the User type contains an ID, a username, an email and the teams he/she are a part of.
// the queries available for users - getUser(with an id) or allusers.
// the register response gives an ok boolean value, the user and the errors if any.
// similarly, the login response returns an ok boolean along with the token and refreshToken
// or any errors.
// the mutations available on user are login and register.

export default `
  type User {
    id: ID!
    username: String!
    email: String!
    teams: [Team!]!
  }

  type Query {
    getUser(id: ID!): User!
    allUsers: [User!]!
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
    login(email: String!, password: String!): LoginResponse!
    register(username: String!, email: String!, password: String!): RegisterResponse!
  }
`;
