import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

const SLIDE_DURATION_SECONDS = 3;

/**
 * Encodes PNG frames (one per slide, already rendered at the target pixel
 * size) into a silent vertical MP4 — hard cuts between slides, no
 * crossfade. The agent adds their own sound/voiceover in TikTok after
 * downloading, so no audio track is produced at all.
 *
 * Uses the image2 demuxer's `-framerate 1/N` (one input frame every N
 * seconds) rather than the concat demuxer's per-file `duration` list —
 * tried that first, but its "repeat the last file with no duration"
 * workaround for the demuxer's documented "last entry's duration is
 * ignored" quirk doesn't act as the zero-length sentinel it's supposed to;
 * verified locally that it added a near-full extra slide of runtime.
 * -framerate sidesteps the whole class of bug.
 */
export async function framesToSlideshowMp4(frames: Buffer[]): Promise<Buffer> {
  if (!ffmpegPath) {
    throw new Error("ffmpeg binary not available in this environment");
  }
  if (frames.length === 0) {
    throw new Error("No frames to encode");
  }

  const dir = await mkdtemp(path.join(tmpdir(), "tiktok-slides-"));
  try {
    for (const [i, frame] of frames.entries()) {
      const framePath = path.join(dir, `frame-${String(i).padStart(2, "0")}.png`);
      await writeFile(framePath, frame);
    }

    const outputPath = path.join(dir, "output.mp4");

    await execFileAsync(ffmpegPath, [
      "-y",
      "-framerate",
      `1/${SLIDE_DURATION_SECONDS}`,
      "-i",
      path.join(dir, "frame-%02d.png"),
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-an",
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
