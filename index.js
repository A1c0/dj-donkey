import {Readable} from 'stream';

import Discord from 'discord.js';
import fetch from 'node-fetch';

import {getSoundUrl, putSoundOnDB} from './app/db.mjs';
import {loadDotEnv} from './lib/dotenv.js';

loadDotEnv ();

const client = new Discord.Client ();

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
const messageAddSoundRegex = /^soundmoji +add +(<:.*?:\d+>) *$/i;

const messageToJoinRegex = /^@sound-moji +joinUs *$/i;

const isMessageForJoin = S.test (messageToJoinRegex);

const isSoundmoji = S.test (/^<:[a-zA-Z0-9]+:\d+>$/);

const isMessageForAddSound = S.test (messageAddSoundRegex);

client.on ('message', async message => {
  const guildId = message.guild.id;
  const messageContent = message.content;
  if (isMessageForAddSound (messageContent)) {
    const emoji = S.maybeToNullable (firstGroupMatch (messageAddSoundRegex)
                                                     (messageContent));
    const attachment = message.attachments.toJSON ()[0]?.attachment;

    try {
      await promise (putSoundOnDB (guildId) (emoji) (attachment));
      await message.channel.send (`> :information_source: sound add for ${emoji}`);
    } catch (e) {
      await message.channel.send (`> :warning: **Error:** \n> ${e}`);
    }
  } else if (isSoundmoji (messageContent)) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send ('You need to be in a voice channel to play music!');
    const permissions = voiceChannel.permissionsFor (message.client.user);
    if (!permissions.has ('CONNECT') || !permissions.has ('SPEAK')) {
      return message.channel.send ('I need the permissions to join and speak in your voice channel!');
    }
    try {
      const soundUrl = await promise (getSoundUrl (guildId) (messageContent));
      const soundBuffer = await fetch (soundUrl).then (res => res.buffer ());
      const stream = Readable.from (soundBuffer);

      voiceChannel.join ().then (connection => {
        const dispatcher = connection.play (stream);
        dispatcher.on ('end', end => {
          voiceChannel.leave ();
        });
      });
    } catch (e) {
      console.log (e);
    }
  }
});

client
  .login (process.env.DICORD_BOT_TOKEN)
  .then (() => console.log ('client start'));
