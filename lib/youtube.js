import {Duration} from 'luxon';
import youtubedl from 'youtube-dl-exec';

const emptyDuration = {
  years: 0,
  quarters: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
};

export const durationFromSeconds = seconds => Duration.fromObject({seconds});
// .toFormat('mm:ss')

export const getYoutubeInfo = async url => {
  try {
    const data = await youtubedl(url, {
      dumpSingleJson: true,
    });
    const formats = data?.formats ?? [];
    const audioFormat = formats.filter(f => /^.*audio.*$/i.test(f.format));
    // TODO sort to keep best quality
    const audioUrl = audioFormat[0]?.url;
    // TODO check JSON Schema
    return {
      title: data.title,
      secondDuration: data.duration,
      audioUrl,
    };
  } catch (e) {
    throw new Error("Couldn't found youtube informations");
  }
};
