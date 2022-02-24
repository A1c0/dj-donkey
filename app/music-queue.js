import fetch from 'node-fetch';

export class MusicPlayer {
  constructor(guildId, voiceChannelId, connection) {
    this.guildId = guildId;
    this.voiceChannelId = voiceChannelId;
    this.connection = connection;
    this._queue = [];
  }

  async play(queueItem) {
    const res = await fetch(queueItem.audioUrl);
    this.connection.play(res.body);
    const dispatcher = this.connection.play(res.body);
    dispatcher.on('end', this.onMusicEnd);
  }

  async startPlay() {
    const music = this._queue[0];
    if (music) {
      await this.play(music);
    }
  }

  addMusic(music) {
    this.queue.push(music);
  }

  stop() {
    this.connection.stop();
  }

  skip() {
    this._queue = this._queue.slice(1);
    this.stop();
    this.startPlay();
  }

  addNext(music) {
    this._queue = [this._queue[0], music, ...this._queue.slice(0)].filter(
      x => !!x
    );
  }

  get queue() {
    return this._queue;
  }

  async onMusicEnd() {
    this._queue = this._queue.slice(0);
    const nextMusic = this._queue[0];
    if (nextMusic) {
      await this.play(nextMusic);
    }
  }

  isMatch(message) {
    const voiceChannelId = message.member.voice.channel.id;
    const guildId = message.guild.id;
    return this.guildId === guildId && this.voiceChannelId === voiceChannelId;
  }
}

export class MusicPlayerCollection {
  constructor() {
    this._collection = [];
  }

  addMusicPlayer(guildId, voiceChannelId, connection) {
    const musicPlayer = new MusicPlayer(guildId, voiceChannelId, connection);
    this._collection.push(musicPlayer);
    return musicPlayer;
  }

  findByMessage(message) {
    const musicPlayer = this._collection.find(m => m.isMatch(message));
    if (!musicPlayer) {
      throw new Error("Couldn't not found the music player");
    }
    return musicPlayer;
  }
}
