import bcrypt from 'bcrypt';

export default {
  Query: {
    getUser: (parent, { id }, { models }) => models.User.findOne({ where: { id } }),
    allUsers: (parent, args, { models }) => models.User.findAll(),
  },
  Mutation: {
    register: async (parent, { password, ...args }, { models }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await models.User.create({ ...args, password: hashedPassword });
        return true;
      } catch (err) {
        return false;
      }
    },
  },
};
