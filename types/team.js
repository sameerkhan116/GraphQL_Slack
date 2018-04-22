// The team type returns an owener of type user, the members of the team who are an array
// of users an the channels for this team.
// the createTeam response is returned when creating a team. It returns an ok value and any errors.

export default `
  type Team {
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }

  type CreateTeamResponse {
    ok: Boolean!
    errors: [Error!]
  }

  type Mutation {
    createTeam(name: String!): CreateTeamResponse!
  }
`;
