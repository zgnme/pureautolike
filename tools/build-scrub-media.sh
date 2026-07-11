#!/usr/bin/env bash
set -euo pipefail

SOURCE=${1:?Usage: tools/build-scrub-media.sh /path/to/greenscreen.mp4}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
VIDEO_DIR="$ROOT/site/assets/videos"
POSTER_DIR="$ROOT/site/assets/posters"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/pureautolike-scrub.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
command -v qt-faststart >/dev/null
test -f "$SOURCE"

KEY_FILTER='chromakey=0x10b00d:0.10:0.04,despill=green:mix=0.65:expand=0.15,format=rgba'
MASTER="$WORK/clean-master.mov"

echo 'Building clean 1080 x 1920 alpha master...'
ffmpeg -y -v error -i "$SOURCE" -an \
  -vf "$KEY_FILTER,scale=1080:1920:flags=lanczos,format=yuva444p10le" \
  -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le \
  "$MASTER"

echo 'Encoding VP9 alpha assets...'
ffmpeg -y -v error -i "$MASTER" -an -vf 'scale=720:1280:flags=lanczos' \
  -c:v libvpx-vp9 -pix_fmt yuva420p -row-mt 1 -deadline good -cpu-used 4 \
  -crf 27 -b:v 0 -g 6 -auto-alt-ref 0 \
  "$WORK/desktop.webm"

ffmpeg -y -v error -i "$MASTER" -an -vf 'scale=540:960:flags=lanczos' \
  -c:v libvpx-vp9 -pix_fmt yuva420p -row-mt 1 -deadline good -cpu-used 4 \
  -crf 29 -b:v 0 -g 6 -auto-alt-ref 0 \
  "$WORK/mobile.webm"

echo 'Encoding HEVC alpha assets...'
ffmpeg -y -v error -i "$MASTER" -an \
  -filter_complex '[0:v]format=rgba,split[color][mask];[color]format=rgb24[color];[mask]alphaextract,erosion[alpha];[color][alpha]alphamerge,scale=720:1280:flags=lanczos,format=bgra[out]' \
  -map '[out]' \
  -c:v hevc_videotoolbox -tag:v hvc1 -alpha_quality 0.85 -b:v 18M -g 6 \
  "$WORK/desktop-hevc-tail.mov"
qt-faststart "$WORK/desktop-hevc-tail.mov" "$WORK/desktop-hevc.mov" >/dev/null

ffmpeg -y -v error -i "$MASTER" -an \
  -filter_complex '[0:v]format=rgba,split[color][mask];[color]format=rgb24[color];[mask]alphaextract,erosion[alpha];[color][alpha]alphamerge,scale=540:960:flags=lanczos,format=bgra[out]' \
  -map '[out]' \
  -c:v hevc_videotoolbox -tag:v hvc1 -alpha_quality 0.85 -b:v 11M -g 6 \
  "$WORK/mobile-hevc-tail.mov"
qt-faststart "$WORK/mobile-hevc-tail.mov" "$WORK/mobile-hevc.mov" >/dev/null

echo 'Rendering transparent posters...'
ffmpeg -y -v error -ss 5 -i "$MASTER" -frames:v 1 \
  -vf 'scale=900:1600:flags=lanczos,format=rgba' "$WORK/desktop.png"
ffmpeg -y -v error -ss 5 -i "$MASTER" -frames:v 1 \
  -vf 'scale=540:960:flags=lanczos,format=rgba' "$WORK/mobile.png"

echo 'Validating media...'
for file in "$WORK/desktop.webm" "$WORK/mobile.webm" "$WORK/desktop-hevc.mov" "$WORK/mobile-hevc.mov"; do
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=codec_name,width,height,r_frame_rate:format=duration \
    -of compact=p=0 "$file"
done

ffmpeg -v error -c:v libvpx-vp9 -i "$WORK/desktop.webm" -vf alphaextract -frames:v 1 -f null -
ffmpeg -v error -c:v libvpx-vp9 -i "$WORK/mobile.webm" -vf alphaextract -frames:v 1 -f null -
ffmpeg -v error -i "$WORK/desktop-hevc.mov" -vf alphaextract -frames:v 1 -f null -
ffmpeg -v error -i "$WORK/mobile-hevc.mov" -vf alphaextract -frames:v 1 -f null -

python3 - "$WORK/desktop-hevc.mov" "$WORK/mobile-hevc.mov" <<'PY'
import sys

for path in sys.argv[1:]:
    data = open(path, 'rb').read()
    assert data.find(b'moov') < data.find(b'mdat'), f'moov is not before mdat: {path}'
PY

mv "$WORK/desktop.webm" "$VIDEO_DIR/interactive-scrub-cutout-desktop-fast-720.webm"
mv "$WORK/mobile.webm" "$VIDEO_DIR/interactive-scrub-cutout-mobile-fast-540.webm"
mv "$WORK/desktop-hevc.mov" "$VIDEO_DIR/interactive-scrub-cutout-desktop-fast-720-hevc.mov"
mv "$WORK/mobile-hevc.mov" "$VIDEO_DIR/interactive-scrub-cutout-mobile-fast-540-hevc.mov"
mv "$WORK/desktop.png" "$POSTER_DIR/interactive-scrub-poster-desktop-900.png"
mv "$WORK/mobile.png" "$POSTER_DIR/interactive-scrub-poster-mobile-540.png"

echo 'Scrub media build complete.'
