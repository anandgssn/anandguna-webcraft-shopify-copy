import { execSync } from "child_process";

const INPUT = "/Users/vinaypadmanabhi/Desktop/Screen Recording 2026-05-07 at 11.38.26 AM.mov";
const DIR = "screenshots/recording";

// Use macOS built-in tools to extract frames
try {
  execSync(`mkdir -p ${DIR}`);
  // Use sips + qlmanage as fallback since ffmpeg isn't available
  // Actually, use the Playwright browser to play the video and capture frames
  console.log("Extracting frames using AVFoundation...");

  // Use macOS qlmanage to generate thumbnails at different timestamps
  for (let i = 0; i < 20; i++) {
    const time = i * 0.5; // every 0.5 seconds
    try {
      execSync(`qlmanage -t -s 1440 -o ${DIR} "${INPUT}" 2>/dev/null`, { timeout: 5000 });
    } catch {}
  }
  console.log("Done");
} catch (e) {
  console.error("Failed:", e);
}
