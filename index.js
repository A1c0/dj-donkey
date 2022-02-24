import Discord from 'discord.js';

import {MusicPlayerCollection} from './app/music-queue.js';
import {loadDotEnv} from './lib/dotenv.js';
import {durationFromSeconds, getYoutubeInfo} from './lib/youtube.js';

loadDotEnv();

class Command {
  constructor(regex, func) {
    this.regex = regex;
    this.func = func;
  }
}

const collection = new MusicPlayerCollection();

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
  const messageContent = message.content;
  const command = commands.find(c => c.regex.test(messageContent));
  if (command) {
    const r = command.regex.exec(messageContent);
    await command.func(message, r[1]);
  }
});

function checkJoin(message) {
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    throw new Error('You need to be in a voice channel to play music!');
  }
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    throw new Error(
      'I need the permissions to join and speak in your voice channel!'
    );
  }
}

async function _joinChannel(message) {
  try {
    checkJoin(message);
  } catch (e) {
    message.channel.send(e.message);
  }
  try {
    const connection = await voiceChannel.join();
    message.channel.send('I am finally here, performing for you!');
    message.channel.send(
      'https://www.mariowiki.com/images/e/e8/Cranky_Kong_DJ.gif'
    );
    return connection;
  } catch (e) {
    console.log(e);
  }
}

async function findOrCreateMusicPlayer(message) {
  try {
    return collection.findByMessage(message);
  } catch (e) {
    const connection = await _joinChannel(message);
    const voiceChannelId = message.member.voice.channel.id;
    const guildId = message.guild.id;
    return collection.addMusicPlayer(guildId, voiceChannelId, connection);
  }
}

async function _play(message, url) {
  try {
    const music = await getYoutubeInfo(url);
    const musicPlayer = collection.findByMessage(message);
    musicPlayer.addMusic(music);
    if (musicPlayer.queue.length === 1) {
      await _playQueue(message);
      return;
    }
    return message.channel.send(
      `Queuing ${music.title} \`${durationFromSeconds(music.secondDuration)}`
    );
  } catch (e) {
    return message.channel.send(`Oups Something wrong happen : ${e}`);
  }
}

async function _stop(message) {
  const musicPlayer = findOrCreateMusicPlayer(message);
  musicPlayer.stop();

  message.channel.send('Stopping :(');
}

async function _next(message, url) {
  const music = await getYoutubeInfo(url);
  const musicPlayer = await findOrCreateMusicPlayer(message);
  musicPlayer.addNext(music);
  return message.channel.send(`Next song will be ${url}`);
}

async function _skip(message) {
  const musicPlayer = await findOrCreateMusicPlayer(message);
  if (musicPlayer.queue.length <= 1) {
    message.channel.send('No song to skip to');
    await _stop();
    return;
  }
  musicPlayer.skip();
  message.channel.send('Skipped');
}

async function _list(message) {
  const musicPlayer = await findOrCreateMusicPlayer(message);
  const queue = musicPlayer.queue;
  if (queue.length === 0) {
    return message.channel.send('The queue is empty :(');
  }
  const msg = queue
    .map(
      ({title, secondDuration}, index) =>
        ` ${index}. _${title}_ \`(${durationFromSeconds(secondDuration)})\``
    )
    .join('\n');
  return message.channel.send(msg);
}

async function _disconnect(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      'I will not disconnect! Come get me in the voice channel!'
    );
  try {
    await _stop(message);
    voiceChannel.leave();
    return message.channel.send('Ok, I will miss you.');
  } catch (e) {
    console.log(e);
  }
}

async function _playQueue(message) {
  const musicPlayer = await findOrCreateMusicPlayer(message);
  if (musicPlayer.queue.length === 0) {
    message.channel.send('ERROR: Trying to play an empty queue :o');
    return;
  }

  const music = await musicPlayer.startPlay();
  message.channel.send(`Playing ${music.title}`);
}

client
  .login(process.env.DICORD_BOT_TOKEN)
  .then(() => console.log('client start'));
