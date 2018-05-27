import { RedisPubSub } from 'graphql-redis-subscriptions';

// creating pubsub using reddis since graphql documentation says that this should be
// used for a production build.
export default new RedisPubSub({
  connection: {
    host: '127.0.0.1',
    port: '6379',
    retryStrategy: options => Math.max(options.attempt * 100, 3000),
  },
});
