#!/bin/sh
# Turns source images in assets-src/ into web-sized JPEGs in public/assets/.
# App screenshots: run MARKETING_SHOTS=1 bun run test:e2e:verify -- marketing-shots in ../zeporah-pilot first.
cd "$(dirname "$0")"
mkdir -p public/assets/app public/assets/people
for f in assets-src/app/*.png; do
  name=$(basename "$f" .png)
  case "$name" in desk-*) size=1920 ;; *) size=1170 ;; esac
  sips -s format jpeg -s formatOptions 72 -Z "$size" "$f" --out "public/assets/app/$name.jpg" >/dev/null
done

# Focused details of the 2880x1800 desk captures: name, source, x, y, width, height.
# (sips treats a zero offset as "centre", so offsets start at 1.)
crop() {
  sips -c "$6" "$5" --cropOffset "$4" "$3" "assets-src/app/$2.png" --out "/tmp/zeporah-$1.png" >/dev/null
  sips -s format jpeg -s formatOptions 78 -Z 1600 "/tmp/zeporah-$1.png" --out "public/assets/app/$1.jpg" >/dev/null
  rm -f "/tmp/zeporah-$1.png"
}
crop detail-consent-hold desk-consent-hold 1901 378 917 1235
crop detail-who-can-see desk-who-can-see-what 535 165 2296 1366
crop detail-audit desk-audit 535 165 2296 1193
crop detail-catch-me-up desk-catch-me-up 802 74 1276 1654
crop detail-record desk-record 494 173 2345 1061
crop detail-my-work desk-my-work 494 144 2386 1090

for f in assets-src/people/*.jpg; do
  [ -e "$f" ] || continue
  sips -s format jpeg -s formatOptions 80 -Z 1800 "$f" --out "public/assets/people/$(basename "$f")" >/dev/null
done
du -sh public/assets/app public/assets/people
