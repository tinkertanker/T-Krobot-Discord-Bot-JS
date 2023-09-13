//if you want to use this, remember to require "timedmessage.js"
//use it by timedmessage(){}
module.exports = (channel, text, duration) => {
  channel.send(text).then((message) => {
    if (duration == -1 || duration == 0) {
      return;
    }
    setTimeout(() => {
      message.delete();
    }, 1000 * duration);
  });
};
