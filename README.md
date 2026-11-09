# Breath of Fire III: game specifications

Independent research on the file formats, memory layouts and runtime of *Breath of Fire III* (US, PlayStation). Read it at <https://raulcorreia7.github.io/bof3-wiki/>.

This repository holds no game data and no game assets. *Breath of Fire* and the game belong to Capcom, and the PlayStation belongs to Sony. This project is not affiliated with or endorsed by either company. The text is under the MIT license in `LICENSE`.

Part of the [Breath of Fire III workspace](https://github.com/raulcorreia7/bof3). The wiki is the reference for the file formats that [bof3-tools](https://github.com/raulcorreia7/bof3-tools) reads and the structs that [bof3-decomp](https://github.com/raulcorreia7/bof3-decomp) names. To get, build and run those tools, follow the README of each project: its `#requirements`, `#set-up`, `#build`, `#run` and `#check` sections.

The site is built with [Astro Starlight](https://starlight.astro.build/). Pages are Markdown in `src/content/docs/`. `nav.json` sets the sidebar order.

## Requirements

| Tool                                  | Version  | Get it                                                       |
| ------------------------------------- | -------- | ------------------------------------------------------------ |
| Node.js                               | 22.23.4+ | <https://nodejs.org/en/download>                             |
| Python                                | 3.11+    | <https://www.python.org/downloads/>                          |
| [dprint](https://dprint.dev/install/) | any      | `cargo install dprint` or the installer on the dprint site   |
| Chrome or Chromium (diagram check)    | any      | your package manager; set `CHROMIUM` to the binary if needed |

The wiki needs no game data and no disc image.

## Set up

```sh
git clone https://github.com/raulcorreia7/bof3-wiki.git
cd bof3-wiki
npm ci
```

## Build

```sh
npm run build    # writes dist/: pages, search index, llms.txt, sitemap; validates links
```

## Run

```sh
npm run dev        # live preview at http://localhost:4321/bof3-wiki/
npm run build && npm run preview   # serve the built site at http://localhost:4321/bof3-wiki/
```

## Check

```sh
dprint check                  # Markdown and JSON format; dprint fmt fixes it
python3 tools/check_pages.py  # page template, titles, orphan pages
npm run build                 # links and anchors
npm run check:diagrams        # diagram readability; needs the build and Chrome
```

## Next

- [CONTRIBUTING.md](CONTRIBUTING.md): page template, where a fact lives, how to submit a change.
- [AGENTS.md](AGENTS.md): the same rules, short, for an agent.
