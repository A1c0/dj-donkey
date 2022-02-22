import Discord from 'discord.js';
import {loadDotEnv} from './lib/dotenv.js';
import fetch from 'node-fetch';
import {getYoutubeInfo} from './lib/youtube.js';

loadDotEnv();

class Command {
  constructor(regex, func) {
    this.regex = regex;
    this.func = func;
  }
}

class MusicPlayer {
  constructor(guildId, connection) {
    this.guildId = guildId;
    this.connection = connection;
  }

  async play(queueItem) {
    const res = await fetch(queueItem);
    this.connection.play(res.body);
  }

  stop() {}

  isGuildId(guildId) {
    return this.guildId === guildId;
  }
}

const client = new Discord.Client();

client.once('ready', () => {
  console.log('Ready!');
});

client.once('reconnecting', () => {
  console.log('Reconnecting!');
});

client.once('disconnect', () => {
  console.log('Disconnect!');
});

const commands = [
  new Command(/^!play (.*)$/i, _play),
  new Command(/^!stop$/i, _stop),
  new Command(/^!next (.*)$/i, _next),
  new Command(/^!skip$/i, _skip),
  new Command(/^!list$/i, _list),
  new Command(/^!disconnect$/i, _disconnect),
];

client.on('message', async message => {
  commands.forEach(command => _checkCommand(command, message));
});

function _checkCommand(command, message) {
  const messageContent = message.content;
  if (command.regex.test(messageContent)) {
    const r = command.regex.exec(messageContent);
    command.func(message, r[1]);
  }
}

async function _play(message, url) {
  try {
    const music = await getYoutubeInfo(url);
    queue.push(music);
    if (queue.length === 1) {
      return _playQueue(message);
    }
    return message.channel.send(`Queuing ${url}`);
  } catch (e) {
    return message.channel.send(`Oups Something wrong happen : ${e}`);
  }
}

function _stop(message) {
  musicPlayer.stop();
  queue.splice(0, queue.length);
  return message.channel.send('Stopping :(');
}

function _next(message, url) {
  if (queue.length === 0) {
    return _play(url, message);
  }
  queue.splice(1, 0, url);
  return message.channel.send(`Next song will be ${url}`);
}

function _skip(message) {
  if (queue.length <= 1) {
    message.channel.send('No song to skip to');
    return _stop();
  }
  queue.splice(0, 1);
  musicPlayer.stop();
  return _playQueue(message);
}

function _list(message) {
  if (queue.length === 0) {
    return message.channel.send('The queue is empty :(');
  }
  const msg = queue.map((value, index) => ` ${index}. ${value}`).join('\n');
  return message.channel.send(msg);
}

function _disconnect(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      'I will not disconnect! Come get me in the voice channel!'
    );
  try {
    _stop(message);
    voiceChannel.leave();
    return message.channel.send('Ok, I will miss you.');
  } catch (e) {
    console.log(e);
  }
}

function _playQueue(message) {
  if (queue.length === 0) {
    return message.channel.send('ERROR: Trying to play an empty queue :o');
  }
  if (!_joinChannel(message)) {
    queue.splice(0, queue.length);
    return;
  }
  message.channel.send(
    'https://www.mariowiki.com/images/e/e8/Cranky_Kong_DJ.gif'
  );
  musicPlayer.play(queue[0]);
  return message.channel.send(`Playing ${queue[0]}`);
}

function _joinChannel(message) {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    message.channel.send('You need to be in a voice channel to play music!');
    return false;
  }
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    message.channel.send(
      'I need the permissions to join and speak in your voice channel!'
    );
    return false;
  }
  try {
    voiceChannel.join();
    message.channel.send('I am finally here, performing for you!');
    return true;
  } catch (e) {
    console.log(e);
  }
}

client
  .login(process.env.DICORD_BOT_TOKEN)
  .then(() => console.log('client start'));
