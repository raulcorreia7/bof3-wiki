# Agent guidance

bof3-wiki is the specs site of *Breath of Fire III* (PS1): file formats, data tables and game
systems, built with Astro Starlight. Read [CONTRIBUTING.md](CONTRIBUTING.md) before you change a
page. It defines the page template, the confidence levels, the callouts and the rule that each fact
lives on one page.

## Find the guide for a task

| Need                                  | Read                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Which file holds what                 | [Repository layout](CONTRIBUTING.md#repository-layout)                                  |
| Which page owns a fact                | [Where a fact lives](CONTRIBUTING.md#where-a-fact-lives)                                |
| The sections every page has           | [Page template](CONTRIBUTING.md#page-template)                                          |
| How to add or change a fact           | [Add or change a fact](CONTRIBUTING.md#add-or-change-a-fact)                            |
| Links, confidence, callouts, diagrams | [Links](CONTRIBUTING.md#links) and the sections after it                                |
| Install, build, preview, check        | [README](README.md#requirements) and [Build and check](CONTRIBUTING.md#build-and-check) |

## Rules

- The wiki states game and format facts only. No tool output, progress or project history. The
  one code form is the `c` struct block, with its `Source:` link to the decompilation header
  (`CONTRIBUTING.md`, "Record layouts").
- Pages are Markdown in `src/content/docs/`. `nav.json` lists every page and sets the sidebar order.
  `redirects.json` maps old URLs to pages. Edit those files by hand; nothing generates them.
- Link a page by its site URL, relative to the page's own URL (`../formats/emi/#header`), not by
  file name. A file-path link checker reports these links as broken; they are not. `npm run build`
  validates every link.
- Before you push, run `dprint check`, `npm run check` and `npm run build`, plus
  `npm run check:diagrams` after a diagram change ([checks](README.md#check)).
- Keep game data, disc images and extracted assets out of the repository.

## Index

- Skills: none.
- Tools: [tools/check_pages.py](tools/check_pages.py) (`npm run check`) and
  [tools/check_diagrams.mjs](tools/check_diagrams.mjs) (`npm run check:diagrams`).
- CI: [.github/workflows/pages.yml](.github/workflows/pages.yml) builds and publishes the site.
- Published: [site](https://raulcorreia7.github.io/bof3-wiki/). For a model:
  [llms.txt](https://raulcorreia7.github.io/bof3-wiki/llms.txt) (index),
  [llms-small.txt](https://raulcorreia7.github.io/bof3-wiki/llms-small.txt) (compact),
  [llms-full.txt](https://raulcorreia7.github.io/bof3-wiki/llms-full.txt) (everything).
- Project standard: [docs/standard.md](https://github.com/raulcorreia7/bof3/blob/main/docs/standard.md).

## Writing

Docs, comments, commit messages and pull requests follow the [project standard](https://github.com/raulcorreia7/bof3/blob/main/docs/standard.md#writing).
A comment is one line and only where a name cannot say it ([standard](https://github.com/raulcorreia7/bof3/blob/main/docs/standard.md#comments)).
