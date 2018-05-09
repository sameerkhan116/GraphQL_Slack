// The team type returns an owener of type user, the members of the team who are an array
// of users an the channels for this team.
// the createTeam response is returned when creating a team. It returns an ok value and any errors.

export default `
  type Team {
    id: Int!
    name: String!
    admin: Boolean!
    members: [User!]!
    channels: [Channel!]!
  }

  type Query {
    allTeams: [Team!]!
    inviteTeams: [Team!]!
    getTeamMembers(teamId: Int!): [User!]!
  }

  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type VoidResponse {
    ok: Boolean!
    errors: [Error!]
  }

  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
    addMember(email: String!, teamId: Int!): VoidResponse!
  }
`;
