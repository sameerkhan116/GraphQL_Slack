import { pick } from 'lodash'; // for picking certain values from the errors that we get

// check the error messages and see if the error is a type of validation error thrown
// by sequelize. If it is, map over this particular error and get the path and mesasge.
// Return the error message.
const formatErrors = (e, models) => {
  if (e instanceof models.sequelize.ValidationError) {
    return e.errors.map(x => pick(x, ['path', 'message']));
  }
  return [{ path: 'name', message: 'Oops! Something went wrong.' }];
};

export default formatErrors;
