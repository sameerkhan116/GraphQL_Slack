import jwt from 'jsonwebtoken'; // to sign, verify and decode tokens
import _ from 'lodash'; // for certain helper functions
import bcrypt from 'bcrypt'; // to compare the hashed password

// create tokens function - takes a user, secret and secret2 and signs the token using the userid
// the token is set to expire in 1h and the secret is the secret we provided.
// the refresh token expires in 7days and we use the secret2 to sign this.
// finally, return the token and refreshToken
export const createTokens = (user, secret, secret2) => {
  const createToken = jwt.sign(
    {
      user: _.pick(user, 'id'),
    },
    secret,
    {
      expiresIn: '1h',
    },
  );

  const refreshToken = jwt.sign(
    {
      user: _.pick(user, 'id'),
    },
    secret2,
    {
      expiresIn: '7d',
    },
  );

  return [createToken, refreshToken];
};

// the refresh token function takes any previous tokens, refreshToken, the db of models and the
// secret keys and refreshes the tokens (in case the original token is expired or invalid)
// we first try to get the userId from the refreshToken. If we do not get it then the user trying
// to login is not valid and we just return. Otherwise, get the user from the User model with
// this id. We create a refreshSecret and verify the refresh token with this secret. (we used this
// secret when using jwt sign in tryLogin). If this works, we get the netoken and
// newRefreshToken from the createTokens functions and then return the newToken and refreshToken
// along with the user.
export const refreshTokens = async (token, refreshToken, models, SECRET, SECRET2) => {
  let userId = -1;
  try {
    const { user: { id } } = jwt.decode(refreshToken);
    userId = id;
  } catch (e) {
    return {};
  }

  if (!userId) {
    return {};
  }

  const user = await models.User.findOne({ where: { id: userId }, raw: true });

  if (!user) {
    return {};
  }

  const refreshSecret = user.password + SECRET2;

  try {
    jwt.verify(refreshToken, refreshSecret);
  } catch (e) {
    return {};
  }

  const [newToken, newRefreshToken] = await createTokens(user, SECRET, refreshSecret);
  return {
    token: newToken,
    refreshToken: newRefreshToken,
    user,
  };
};

// the trylogin function used for the login mutation in our schema. This function gets the email,
// password, models and secrets as args. We then find the user in the db with the email that was
// provided. If the user was not found, we can return the LoginResponse with ok as false and msg
// saying that user does not exist. If we find a user with this id, we compare hashed password with
// the input password. If password doesn't work then correspoding login response with error message.
// otherwise, create the refreshTokensecret using the user password and the second secret. We can
// then get the token and refreshToken from the creatTokens function and return the ok LoginResponse
export const tryLogin = async (email, password, models, SECRET, SECRET2) => {
  const user = await models.User.findOne({ where: { email }, raw: true });
  if (!user) {
    return {
      ok: false,
      errors: [{ path: 'email', message: 'No user with that email exists' }],
    };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return {
      ok: false,
      errors: [{ path: 'password', message: 'Invalid password' }],
    };
  }

  const refreshTokenSecret = user.password + SECRET2;

  const [token, refreshToken] = await createTokens(user, SECRET, refreshTokenSecret);

  return {
    ok: true,
    token,
    refreshToken,
  };
};
