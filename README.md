# Breath of Fire III: game specifications

Independent research on the file formats, memory layouts and runtime of *Breath of Fire III* (US, PlayStation). Read it at <https://raulcorreia7.github.io/bof3-wiki/>.

This repository holds no game data and no game assets. *Breath of Fire* and the game belong to Capcom, and the PlayStation belongs to Sony. This project is not affiliated with or endorsed by either company. The text is under the MIT license in `LICENSE`.

Part of the [Breath of Fire III workspace](https://github.com/raulcorreia7/bof3). The wiki is the reference for the file formats that [bof3-tools](https://github.com/raulcorreia7/bof3-tools) reads and the structs that [bof3-decomp](https://github.com/raulcorreia7/bof3-decomp) names. Each of those projects documents its own requirements, set-up, build and checks.

The site is an [Astro Starlight](https://starlight.astro.build/) build. Pages are Markdown in `src/content/docs/`; `nav.json` sets the sidebar order.

## Requirements

| Tool                               | Version              | Get it                                                       |
| ---------------------------------- | -------------------- | ------------------------------------------------------------ |
| Node.js                            | 24 (`.node-version`) | <https://nodejs.org/en/download>                             |
| Python                             | 3.11+                | <https://www.python.org/downloads/>                          |
| Chrome or Chromium (diagram check) | any                  | your package manager; set `CHROMIUM` to the binary if needed |

The wiki needs no game data and no disc image.

## Set up

```sh
git clone https://github.com/raulcorreia7/bof3-wiki.git
cd bof3-wiki
npm ci
```

## Build

```sh
npm run build    # writes dist/ (pages, search index, llms.txt, sitemap) and validates links
```

## Run

```sh
npm run dev      # live preview at http://localhost:4321/bof3-wiki/
```

## Check

```sh
npm run check                 # format, page template, build, diagrams (needs Chrome) and links
npx dprint fmt                # fix the format
python3 tools/check_sources.py ../bof3-decomp  # every Source: link; needs a decompilation checkout
```

## Next

- [CONTRIBUTING.md](CONTRIBUTING.md): page template, where a fact lives, how to submit a change.
- [AGENTS.md](AGENTS.md): the same paths for a coding agent.
