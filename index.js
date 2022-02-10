import Discord from 'discord.js';
import {loadDotEnv} from './lib/dotenv.js';

loadDotEnv ();

class Command {
  constructor(regex, func) {
    this.regex = regex;
    this.func = func;
  }
}


const client = new Discord.Client ();
const musicPlayer;

client.once ('ready', () => {
  console.log ('Ready!');
});

client.once ('reconnecting', () => {
  console.log ('Reconnecting!');
});

client.once ('disconnect', () => {
  console.log ('Disconnect!');
});

// prettier-sanctuary-ignore
const commands = [
  new Command(/^!play (.*)$/i, _play),
  new Command(/^!stop$/i, _stop),
  new Command(/^!next (.*)$/i, _next),
  new Command(/^!skip$/i, _skip),
  new Command(/^!list$/i, _list)
]

const queue = [];

client.on ('message', async message => {
  const messageContent = message.content;
  commands.forEach(command => _checkCommand(command, messageContent));
});

function _checkCommand(command, message) {
  if (S.test(command.regex)) {
    command.func(S.maybeToNullable (firstGroupMatch (command.regex) (message)), message);
  }
}

function _play(url, message) {
  queue.push(url);
  if (queue.length === 1) {
    return _playQueue(message);
  }
  return message.channel.send(`Queuing ${url}`);
}

function _stop() {
  musicPlayer.stop();
  queue.splice(0, queue.length);
  return message.channel.send('Stopping :(');
}

function _next(url, message) {
  if (queue.length === 0) {
    return _play(url, message);
  }
  queue.splice(1, 0, url);
  return message.channel.send(`Next song will be ${url}`);
}

function _skip(url ,message) {
  if (queue.length <= 1) {
    message.channel.send('No song to skip to');
    return _stop();
  }
  queue.splice(0,1);
  musicPlayer.stop();
  return _playQueue(message);
}

function _list(url, message) {
  if (queue.length === 0) {
    return message.channel.send('The queue is empty :(');
  }
  return message.channel.send(queue.join("\n"));
}

function _playQueue(message) {
  if (queue.length === 0) {
    return message.channel.send('ERROR: Trying to play an empty queue :o');
  }
  _joinChannel(message);
  musicPlayer.play(queue[0]);
  return message.channel.send(`Playing ${queue[0]}`);
}

function _joinChannel(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send ('You need to be in a voice channel to play music!');
  const permissions = voiceChannel.permissionsFor (message.client.user);
  if (!permissions.has ('CONNECT') || !permissions.has ('SPEAK')) {
    return message.channel.send ('I need the permissions to join and speak in your voice channel!');
  }
  try {
    voiceChannel.join()
  } catch (e) {
    console.log (e);
  }
}

client
  .login (process.env.DICORD_BOT_TOKEN)
  .then (() => console.log ('client start'));
