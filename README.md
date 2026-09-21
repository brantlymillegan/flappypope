# Flappy Pope

A dependency-free pixel-art flying game. Choose a winged pope, angel, friar, or church bell and fly between church pillars decorated with crosses, stained-glass rose windows, and bells.

Play at **[artesnobiles.com/flappypope](https://artesnobiles.com/flappypope/)**.

Source: [brantlymillegan/flappypope](https://github.com/brantlymillegan/flappypope).

## Run locally

Requires Node.js 20 or newer. No installation is needed.

```sh
npm run dev
```

Open http://localhost:5173. `PORT=5174 npm run dev` changes the port.

The header uses the same expanding theme icon control as Artes Nobiles. Hover to reveal the other two modes, or click/tap to keep the options open; choosing a mode, clicking outside, or pressing Escape closes them. System is the default and follows your device's appearance, including changes while the game is open. The saved choice is shared with Artes Nobiles and other open tabs on the same origin. The game scenery, pillars, floor, score display, and overlays all follow that theme immediately, including during a flight.

The header icon uses the exact Flappy Pope revision 4 animation from Artes Nobiles: an immediate backflip followed by two wingbeats. It plays once when the page opens and replays on hover, tap, click, or keyboard focus after settling. Tapping the icon does not reload or start the game; the adjacent title remains the home link. Background tabs wait until visible for the initial play, and reduced-motion preferences keep the static icon. The original SVG remains the fallback if the animation fails to load.

Space, Arrow Up, click, or tap to flap. P or Escape pauses. Choose **Sound on** for synthesized chiptune music and sound effects; playback starts after a user gesture. Best score and sound preference are stored on this device when browser storage is available. Every new page opens with the pope selected. All four characters have identical physics and face right.

The bottom-right fullscreen button expands the game to fit portrait, landscape, and ultrawide screens while keeping the full flight height and proportional pixel art. The course and scenery extend across wider displays. Use the same button or Escape to leave fullscreen; an active flight pauses when you leave. Browsers without native fullscreen use a full-window layout. Choosing another flyer exits fullscreen and returns focus to the character picker.

## Scenery, pillars, and music rotation

Each game chooses a setting, pillar style, and hymn from independent shuffled rotations. Each rotation uses all ten choices before repeating, with no consecutive repeats at cycle boundaries. Pausing or switching themes preserves the current setting, pillars, song, and flight.

The ten pillar designs draw on basilica marble, Gothic tracery, Romanesque arches, bell towers, Cosmati mosaics, papal keys, Celtic abbeys, monastery timber, Baroque chapels, and stained glass. Each uses a matching day/night palette, while keeping the same obstacle dimensions and gap geometry.

The ten settings are Roman Basilica, Assisi Hills, Alpine Chapel, Gothic Cathedral, Monastery Garden, Seaside Church, Spanish Mission, Island Abbey, Woodland Chapel, and Riverside Basilica. Each paired atlas contains a daylight panel above the matching night panel. Transparent sky areas are composited over the matching sky color.

The ten synthesized hymn loops are All Creatures of Our God and King; Holy God, We Praise Thy Name; O Come, O Come, Emmanuel; O Come, All Ye Faithful; Angels We Have Heard on High; Immaculate Mary; Hail, Holy Queen Enthroned Above; Veni Creator Spiritus; Adoro Te Devote; and Pange Lingua Gloriosi.

## Validation

```sh
npm run check
npm test
```

`dist/` is the complete static app, with no build step or external runtime requests. `server.mjs` is a small localhost-only development server.

## Publishing

The code is maintained in this repository. The [Artes Nobiles website workflow](https://github.com/brantlymillegan/artes-nobiles-website/actions/workflows/pages.yml) checks out this repository's `main` branch, runs the game checks and tests, and includes `dist/` at `/flappypope/` in its GitHub Pages deployment. No game source files need to be copied into the website repository.

After pushing a game update to `main`, publish it by running the website's **Deploy website to GitHub Pages** workflow on `master`. With the GitHub CLI:

```sh
git push origin main
gh workflow run pages.yml --repo brantlymillegan/artes-nobiles-website --ref master
```

The game repository's own workflow validates pushes and pull requests; it does not publish on its own. Every website deployment also picks up the latest game version. Only `dist/` is served on the public website; tests and project documentation stay in this repository.

Asset paths support both local hosting at `/` and production hosting at `/flappypope/`. The host should redirect `/flappypope` to `/flappypope/` before serving the page.

## Art and music

- Original pixel character sprites and church obstacles are drawn with Canvas. Ten paired day/night backgrounds were generated using the built-in ImageGen tool and are bundled in `dist/assets/scenes/`. Exact prompt set: [art-prompts.json](docs/art-prompts.json).
- The hymn melodies are traditional public-domain tunes, with original synthesized square- and triangle-wave accompaniment. No sampled recordings are included. Chant rhythms are newly measured adaptations. [Source scores, MIDI references, and transcription notes](docs/music-sources.md) document all ten tunes; track-level source links are also in `dist/hymns.js`.
- Press Start 2P by CodeMan38, licensed under the SIL Open Font License. Font and license are bundled under `dist/assets/`.

Sacred figures and the Eucharist are not player characters. The pope and friar are fictional, generic designs.
