/* eslint-env jest */

import axios from 'axios';

describe('user resolvers', () => {
  test('allUsers', async () => {
    const response = await axios.post('http://localhost:3000/graphql', {
      query: `
        query {
          allUsers {
            id
            username
            email
          }
        }
      `,
    });

    const { data } = response;
    expect(data).toMatchObject({
      data: {
        allUsers: [],
      },
    });
  });

  test('register', async () => {
    const response = await axios.post('http://localhost:3000/graphql', {
      query: `
        mutation {
          register(username: "Sameer", email: "sam@sam.com", password: "sameer") {
            ok
            errors{
              path
              message
            }
            user {
              username
              email
            }
          }
        }
      `,
    });

    const { data } = response;
    expect(data).toMatchObject({
      data: {
        register: {
          ok: true,
          errors: null,
          user: {
            username: 'Sameer',
            email: 'sam@sam.com',
          },
        },
      },
    });

    const response2 = await axios.post('http://localhost:3000/graphql', {
      query: `
        mutation {
          login(email: "sam@sam.com", password: "sameer") {
            token
            refreshToken
          }
        }
      `,
    });

    const { data: { login: { token, refreshToken } } } = response2.data;

    const response3 = await axios.post('http://localhost:3000/graphql', {
      query: `
        mutation {
          createTeam(name: "team1") {
            ok
            team {
              name
            }
          }
        }
      `,
    }, {
      headers: {
        'x-token': token,
        'x-refresh-token': refreshToken,
      },
    });

    expect(response3.data).toMatchObject({
      data: {
        createTeam: {
          ok: true,
          team: {
            name: 'team1',
          },
        },
      },
    });
  });
});
