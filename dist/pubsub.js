'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphqlRedisSubscriptions = require('graphql-redis-subscriptions');

// creating pubsub using reddis since graphql documentation says that this should be
// used for a production build.
exports.default = new _graphqlRedisSubscriptions.RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: '6379',
    retryStrategy: options => Math.max(options.attempt * 100, 3000)
  }
});