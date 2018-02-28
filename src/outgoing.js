const handlePromise = (next, promise) => {
  return promise.then(res => {
    next();
    return res;
  }).catch(err => {
    next(err);
    throw err;
  });
};

const handleText = (event, next, twitter) => {
  if (event.platform !== 'twitter' || event.type !== 'text') {
    return next();
  }

  const chatId = event.raw.chatId;
  const text = event.text;
  const options = event.raw.options;

  return handlePromise(next, twitter.sendText(chatId, text, options));
};

module.exports = {
  'text': handleText,
  pending: {},
};
