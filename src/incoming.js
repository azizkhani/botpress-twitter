import LRU from 'lru-cache';

module.exports = (bp, twitter) => {
  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000,
  });

  const preprocessEvent = (payload) => {
    console.log('preprocessEvent');
    let mid = `${payload.chat.id}_${payload.from.id}_${payload.date}`;

    if (mid && !messagesCache.has(mid)) {
      payload.alreadyProcessed = true;
    } else {
      messagesCache.set(mid, true);
    }

    return payload;
  };

  const extractBasics = (event) => {
    return {
      platform: 'twitter',
      raw: event,
    };
  };

  var stream = twitter.bot.stream('user');
  stream.on('direct_message', function (event) {
    bp.middlewares.sendIncoming({
      type: 'text',
      chat: event.direct_message,
      user: event.direct_message.recipient,
      text: event.direct_message.text,
      message_id: event.direct_message.id,
      ...extractBasics(event)
    });


  });
  
};
