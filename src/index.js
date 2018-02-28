import outgoing from './outgoing';
import actions from './actions';
import umm from './umm';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const Promise = require('bluebird');

import Twitter from './twitter';

let twitter = null;
const outgoingPending = outgoing.pending;

const outgoingMiddleware = (event, next) => {
  if (event.platform !== 'twitter') {
    return next();
  }
  
  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type);
  }

  const setValue = method => (...args) => {
    if (event.__id && outgoingPending[event.__id]) {

      if (args && args[0] && args[0].message_id) {
        let ts = args[0].message_id.split(':')[0];
        ts = ts && ts.substr(4);
        outgoingPending[event.__id].timestamp = parseInt(ts);
        outgoingPending[event.__id].mid = args[0].message_id;
      }

      if (method === 'resolve' &&
          (event.raw.waitDelivery || event.raw.waitRead)) {
        // We skip setting this value because we wait
      } else {
        outgoingPending[event.__id][method].apply(null, args);
        delete outgoingPending[event.__id];
      }
    }
  };

  outgoing[event.type](event, next, twitter).
      then(setValue('resolve'), setValue('reject'));
};

module.exports = {

  config: {
    consumer_key: {type: 'string', required: true, default: '', env: 'TWITTER_CONSUMER_KEY'},
    consumer_secret: {type: 'string', required: true, default: '', env: 'TWITTER_CONSUMER_SECRET'},
    access_token: {type: 'string', required: true, default: '', env: 'TWITTER_ACCESS_TOKEN'},
    access_token_secret: {type: 'string', required: true, default: '', env: 'TWITTER_ACCESS_TOKEN_SECRET'}
  },

  init: function(bp, config) {
    bp.middlewares.register({
      name: 'twitter.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-twitter',
      description: 'Sends out messages that targets platform = twitter.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    });
    

    bp.twitter = {};
    _.forIn(actions, (action, name) => {
      bp.twitter[name] = actions[name];
      let sendName = name.replace(/^create/, 'send');
      bp.twitter[sendName] = Promise.method(function() {

        var msg = action.apply(this, arguments);
        msg.__id = new Date().toISOString() + Math.random();
        const resolver = {event: msg};

        const promise = new Promise(function(resolve, reject) {
          resolver.resolve = resolve;
          resolver.reject = reject;
        });

        outgoingPending[msg.__id] = resolver;

        bp.middlewares.sendOutgoing(msg);

        return promise;
      });
    });

    umm(bp); // Initialize UMM
  },

  ready: async function(bp, configurator) {

    const config = await configurator.loadAll();

    twitter = new Twitter(bp, config);

    twitter.startPolling(bp);
  },
}
