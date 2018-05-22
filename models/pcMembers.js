// the private channel member just needed to create associations.
export default (sequelize) => {
  const PCMember = sequelize.define('pcmember', {});
  return PCMember;
};
