---
title: "STR and XA playback"
description: "The disc stores one movie and three banks of streamed audio as CD-ROM XA sectors outside the ISO9660 data."
---

The disc stores one movie and three banks of streamed audio as CD-ROM XA sectors outside the ISO9660 data. `LOGO/CAPCOM30.STR` is the Capcom logo movie: MDEC video interleaved with stereo XA audio. The three `.STR` files under `BIN/` are audio banks of many short sounds, played by sector range. This page covers the sector layout, the cue tables that map a sound request to a sector range, and the logo movie; the ADPCM format is in [Audio formats](../audio/#xa-adpcm).

## Sector layout

The extracted STR files store each sector as 2,336 bytes, without the 12-byte sync and 4-byte header of a raw 2,352-byte CD sector:

```text
[XA subheader 8][payload 2324][EDC 4]
```

A tool that expects raw sectors needs the sync and a 4-byte header prepended to each sector; removing those 16 bytes restores the stored sector byte for byte.

The XA subheader holds `[file, channel, submode, coding]` twice. The CD hardware passes only sectors whose submode has the audio bit (`0x04`) and whose file and channel match the `CdlSetfilter` filter. `coding` selects mono or stereo and the sample rate ([audio formats](../audio/#xa-adpcm)).

### Files

`LOGO.EXE` plays the movie at boot ([executables](../exe/#boot-chain)); `SND_XAStartStream` plays the three audio banks ([Audio system](../../systems/audio/)).

| Path                      | Content                   |
| ------------------------- | ------------------------- |
| `LOGO/CAPCOM30.STR`       | MDEC video plus stereo XA |
| `BIN/BMAG_XA/MAGIC00.STR` | multiplexed mono XA       |
| `BIN/SCE_XA/S_XA00.STR`   | multiplexed stereo XA     |
| `BIN/SCE_XA/VOICE.STR`    | multiplexed mono XA       |

### Sector classes

Audio sectors have submode `0x64`, or `0xE4` for the last sector of a channel.

| File           | Sectors |         Audio sectors | Coding | Channels | Other sectors                                                    |
| -------------- | ------: | --------------------: | -----: | -------: | ---------------------------------------------------------------- |
| `S_XA00.STR`   |  40,416 |                11,302 |      1 |        8 | 29,113 Form 1 (submode 0), 1 end-of-file sector (submode `0x80`) |
| `MAGIC00.STR`  |  15,408 |                14,856 |      0 |       16 | 552 Form 1 (submode 0)                                           |
| `VOICE.STR`    |   3,536 |                   297 |      0 |        5 | 3,238 Form 1 (user data all zero), 1 end-of-file sector          |
| `CAPCOM30.STR` |   1,155 | 143 stereo and 1 mono |   1, 0 |        2 | 1,010 video (submode `0x42`) and 1 last video sector (`0xC2`)    |

The Form 1 sectors of `S_XA00.STR` (72.0 percent of its sectors) and `MAGIC00.STR` hold non-zero user data: about 1,400 of 2,048 bytes, and 14,227 of the 29,113 blocks in `S_XA00.STR` are distinct. The hardware filter drops them, so the game never plays them; their content is `[unknown]`. In `VOICE.STR` they are zero.

In `S_XA00.STR`, after the first 463 sectors, each 8-sector period holds one sector each of channels 1 and 3 and six Form 1 sectors (5,045 and 5,052 sectors for channels 1 and 3).

## XA cue tables

`SND_XAResolveStream (exe/slus_004_22@0x80163744)` turns a sound request key into the first and last sector of one cue.

The key is `(stream << 12) | cue_index`. Stream 0 is `S_XA00.STR`, 1 is `MAGIC00.STR`, 2 is `VOICE.STR`. The slot ids are in `D_80183230` (`0x2A9`, `0x1B2`, `0x2AA`); the file start is `g_EmiSlotLbas[slot]` ([executables](../exe/#the-disc-file-table)). `D_8018323C[stream]` points to the stream's `u16` cue array in the executable, at `0x801839C4`, `0x801832C4` and `0x80183298`.

The resolver reads the array like this:

- A cue is the value at index `i` and the value at `i + 1`, both masked with `0x7FFF`.
- A value with bit 15 set ends a channel. The code skips the following word and counts one channel.
- The period is 8 sectors for stream 0 and 16 for streams 1 and 2. A channel's sectors repeat once per period.
- The first sector is `start * period + channel`, where `channel` is the number of flagged words before the cue.
- The end bound is `next_start * period + channel`. The bound the reader stores last has 150 sectors (`0x96`) taken off, for an `[unknown]` reason.

Walking every array (a pair of zero words ends the walk) shows in all three files that every cue has `end >= start`, its first sector is an audio sector of the right channel, and every period step inside it is an audio sector of that channel (0 bad).

| Stream        | Cues | Channels |   Array words scanned | Note                                                                                                                                        |
| ------------- | ---: | -------: | --------------------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `MAGIC00.STR` |  880 |       16 |                   896 | clean terminator                                                                                                                            |
| `VOICE.STR`   |    5 |        5 |                    22 | clean terminator                                                                                                                            |
| `S_XA00.STR`  |   11 |        4 | 1,024 (to next array) | no symbol bounds the array end, so the cue count is `[inferred]`. Sector channels 4 to 7 hold 340 audio sectors that no scanned cue reaches |

The cue values exist only in `SLUS_004.22`, at file offset `address - 0x80096000`.

## CAPCOM30 stream layout

`CAPCOM30.STR` has 1,155 sectors: 1,011 video (1,010 with submode `0x42`, the last `0xC2`), 143 stereo audio and 1 mono audio. Each video sector starts with a 32-byte STR chunk header ([psx-spx](https://psx-spx.consoledev.net/cdromformat/)) with magic `0x80010160` in all 1,011. A frame spans several video sectors, one chunk each.

| Offset | Size | Type  | Name              | Meaning                                              |
| -----: | ---: | ----- | ----------------- | ---------------------------------------------------- |
| `0x00` |    4 | `u32` | `magic`           | `0x80010160`                                         |
| `0x04` |    2 | `u16` | `chunk_number`    | chunk number within the frame, 0 to 4                |
| `0x06` |    2 | `u16` | `chunk_count`     | chunks in the frame: 4 (144 frames) or 5 (87 frames) |
| `0x08` |    4 | `u32` | `frame_number`    | 1 to 231 (231 distinct)                              |
| `0x0C` |    4 | `u32` | `demux_size`      | varies per frame                                     |
| `0x10` |    2 | `u16` | `width`           | 320 in 1,011 of 1,011                                |
| `0x12` |    2 | `u16` | `height`          | 240 in 1,011 of 1,011                                |
| `0x14` |    2 | `u16` | `mdec_words`      | varies per frame                                     |
| `0x16` |    2 | `u16` | `id`              | `0x3800`                                             |
| `0x18` |    2 | `u16` | `quantiser_scale` | varies                                               |
| `0x1A` |    2 | `u16` | `version`         | 2                                                    |

`LOGO.EXE` reads the stream from LBA 186,252 ([executables](../exe/#boot-chain)).

## CAPCOM30 timing

The video has 231 frames. The stereo audio is 143 sectors of 2,016 samples per channel at 37,800 Hz, 7.626667 s. At double CD speed (150 sectors per second) 1,155 sectors take 7.700 s, and 231 frames at 30 frames per second take 7.700 s. The audio is shorter by 0.073333 s, 2,772 samples per channel. To play both together outside the game, pad the audio with the gap:

```text
video_seconds = frame_count / frames_per_second
audio_seconds = samples_per_channel / sample_rate
pad_samples   = max(0, round((video_seconds - audio_seconds) * sample_rate))
```

The 30 frames per second and double-speed figures come from the stream's size and the CD rate, not from the game's timing code. `Logo_Init (exe/logo@0x801CE760)` and `Logo_DrawFrame (exe/logo@0x801CEA98)` run the playback; the game schedule is `[unknown]`. The trailing mono sector is a separate stream, not part of the stereo track. No code that controls CDDA playback is recovered.

## Open questions

| Question                                                                        | What would settle it                                                  |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| The use of the 29,665 non-zero Form 1 sectors of `S_XA00.STR` and `MAGIC00.STR` | A reader that bypasses the hardware filter, or proof that none exists |
| The reason for the 150-sector offset in the XA cue end bound                    | The code that stores the end bound                                    |

## Sources and confidence

- **Confidence:** medium. Sector classes, cue arrays and the STR header are read from every sector and array; the unplayed Form 1 content, the 150-sector offset and the playback schedule are not established.
- **Evidence:** the subheaders of every sector of the four files, a walk of the three cue arrays in `SLUS_004.22`, the video chunk headers, and `SND_XAResolveStream`, `Logo_Init` and `Logo_DrawFrame`. The chunk header follows [psx-spx](https://psx-spx.consoledev.net/cdromformat/) ([sources](../../appendix/sources/)).

## Related

- [Audio formats](../audio/): the XA ADPCM sound group and the VAB and SEP formats.
- [Audio system](../../systems/audio/): how the game starts, services and stops an XA stream.
- [Executables and boot files](../exe/): the file table and the logo boot chain.
- [Converting game data](../conversion/): wrapping stored sectors as raw sectors for other tools.
