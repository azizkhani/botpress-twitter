const Twitter = require('twit');
const Promise = require('bluebird');

import incoming from './incoming';

class twitter {
  constructor(bp, config) {
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config');
    }
    this.bot = null;
    this.connected = false;
    this.stream=null;
    this.bot = new Twitter(config);
    bp.logger.info('twitter bot created');
  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config);
  }

  validateConnection() {
    if (!this.connected) {
      throw new Error('You are not connected...');
    }
  }

  static validateText(text) {
    const type = typeof(text);
    if (type !== 'string') {
      throw new Error(
          'Text format is not valid (actual: ' + type + ', required: string)');
    }
  }

  static validateChatId(chatId) {
    const type = typeof(chatId);
    if (type !== 'number') {
      throw new Error('Chat id format is not valid (actual: ' + type +
          ', required: number)');
    }
  }


  static validateOptions(options) {
    const type = typeof(options);
    if (type !== 'object') {
      throw new Error('Options format is not valid (actual: ' + type +
          ', required: object)');
    }
  }

  static validateBeforeReaction(options) {
    if (!(options.file || options.file_comment || options.chat ||
        options.timestamp)) {
      throw new Error(
          'You need to set at least a destination options (file, file_comment, chat, timestamp)...');
    }
  }

  validateBeforeSending(chatId, options) {
    this.validateConnection();
    //twitter.validateChatId(chatId);
    twitter.validateOptions(options);
  }

  sendText(chatId, text, options) {
    this.validateBeforeSending(chatId, options);
    twitter.validateText(text);

    return Promise.fromCallback(() => {
      this.bot.post('direct_messages/new', {
        screen_name: chatId,
        text: text
      }, function(error, message, response) {
      });
    });
  }

  startPolling(bp) {
    incoming(bp, this);
    bp.logger.info('twitter loaded handler');
    //this.stream=this.bot.stream('user');
    bp.logger.info('twitter started polling');
    this.connected = true;
  }
}

module.exports = twitter;
