import argparse
import json
import subprocess
import tempfile
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

def run_command(cmd: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)

def probe_clip(clip_path: str) -> Dict[str, Any]:
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        str(clip_path),
    ]
    try:
        proc = run_command(cmd)
        data = json.loads(proc.stdout)
    except Exception:
        return {}

    info: Dict[str, Any] = {"path": str(clip_path)}
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video":
            info["width"] = stream.get("width")
            info["height"] = stream.get("height")
            rfr = stream.get("r_frame_rate", "0/1")
            try:
                num, den = rfr.split("/")
                info["fps"] = round(int(num) / int(den), 2)
            except:
                info["fps"] = None
            break

    fmt = data.get("format", {})
    try:
        info["duration"] = float(fmt.get("duration", 0))
    except:
        info["duration"] = 0.0

    return info

def ensure_audio(clip: str, temp_dir: Path) -> str:
    cmd_probe = [
        "ffprobe", "-v", "quiet", "-select_streams", "a",
        "-show_entries", "stream=codec_type", "-of", "json", str(clip)
    ]
    try:
        data = json.loads(run_command(cmd_probe).stdout)
        if len(data.get("streams", [])) > 0:
            return clip
    except:
        pass

    augmented = temp_dir / f"audio_aug_{Path(clip).name}.mp4"
    cmd = [
        "ffmpeg", "-y", "-i", str(clip),
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-c:v", "copy", "-c:a", "aac", "-shortest", str(augmented)
    ]
    run_command(cmd)
    return str(augmented)

def normalize_clip(clip: str, output: str, width: int, height: int, fps: int) -> None:
    cmd = [
        "ffmpeg", "-y", "-i", str(clip),
        "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2",
        "-r", str(fps), "-c:v", "libx264", "-crf", "23", "-preset", "medium",
        "-c:a", "aac", "-ar", "44100", "-ac", "2", "-pix_fmt", "yuv420p",
        str(output)
    ]
    run_command(cmd)

def stitch_clips(clips: List[str], output_path: str, transition: str, duration: float) -> Dict[str, Any]:
    probes = [probe_clip(c) for c in clips]
    if not all(probes):
        raise ValueError("Failed to probe one or more clips")

    with tempfile.TemporaryDirectory() as tmpdir:
        temp_dir = Path(tmpdir)
        
        # Normalize to first clip's settings
        ref = probes[0]
        w, h, fps = ref.get("width", 1080), ref.get("height", 1920), int(ref.get("fps", 30))
        
        norm_clips = []
        for i, clip in enumerate(clips):
            norm_path = temp_dir / f"norm_{i}.mp4"
            normalize_clip(clip, str(norm_path), w, h, fps)
            audio_clip = ensure_audio(str(norm_path), temp_dir)
            norm_clips.append(audio_clip)

        if transition == "cut":
            concat_list = temp_dir / "concat.txt"
            with open(concat_list, "w") as f:
                for c in norm_clips:
                    f.write(f"file '{Path(c).resolve()}'\n")
            cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list), "-c", "copy", output_path]
            run_command(cmd)
        elif transition in ["crossfade", "fadeblack"]:
            if len(norm_clips) != 2:
                raise ValueError("Crossfade currently supports exactly 2 clips in this simplified version")
            c1, c2 = norm_clips
            dur1 = probe_clip(c1).get("duration", 0)
            offset = max(0, dur1 - duration)
            cmd = [
                "ffmpeg", "-y", "-i", c1, "-i", c2,
                "-filter_complex",
                f"[0:v][1:v]xfade=transition={transition}:duration={duration}:offset={offset}[v];"
                f"[0:a][1:a]acrossfade=d={duration}[a]",
                "-map", "[v]", "-map", "[a]", output_path
            ]
            run_command(cmd)
        else:
            raise ValueError(f"Unknown transition {transition}")

    return {"status": "success", "output": output_path}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sogna Studio Native Composer")
    parser.add_argument("--clips", nargs="+", required=True, help="List of video files to stitch")
    parser.add_argument("--output", required=True, help="Output MP4 file path")
    parser.add_argument("--transition", choices=["cut", "crossfade", "fadeblack"], default="cut")
    parser.add_argument("--duration", type=float, default=0.5, help="Transition duration")
    args = parser.parse_args()

    try:
        result = stitch_clips(args.clips, args.output, args.transition, args.duration)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)
