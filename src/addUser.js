import jwt from 'jsonwebtoken'; // to verify the set headers

import models from './models'; // the DB models we setup using psql and sequelize.
import { SECRET, SECRET2 } from './index'; // required as a key for verification
import { refreshTokens } from './auth'; // required for refreshing tokens

export const addUser = async (req, res, next) => {
  const token = req.headers['x-token']; // get the token from the x-token header
  // if the token is available (hasn't expired, just verify it with the secret that we are provided)
  // and then attach this user to the req so it can be used in the context of the graphqlExpress.
  // otherwise, get refreshTokens from the header (which have a much longer validity)
  // sue the refreshToken to get a new set of token and refresh token
  // once they are available, we can set the headers to these new tokens here, in the response
  // and finally, attach this new user to the requests.
  if (token) {
    try {
      const { user } = jwt.verify(token, SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(token, refreshToken, models, SECRET, SECRET2);
      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }
      req.user = newTokens.user;
    }
  }
  // pass to next middleware
  next();
};
