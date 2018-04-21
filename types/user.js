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
