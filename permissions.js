// The create user function takes a resolver which then creates another function
// and a child resolver. The base resolver is then resolved and if it succeeds, then
// the child resolver is returned.
const createResolver = (resolver) => {
  const baseResolver = resolver;
  baseResolver.createResolver = (childResolver) => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

// the requiresAuth function - that can be run before any other function to check
// if the user is available in the context in the resolver function.
export const requiresAuth = createResolver((parent, args, { user }) => {
  if (!user || !user.id) {
    throw new Error('Not authenticated');
  }
});

