---
title: "Character sprites"
description: "Character sprites are one container that the game loads to 0x8003B800."
---

Character sprites are one container that the game loads to `0x8003B800`. It holds three sections, and each section is a table of nodes that carry the pixel data and palettes. Battle archives (`BPLCHAR`), field archives (`PLCHAR`) and `ETC/START.EMI` carry containers, raw (entry type 0) or [LZ77](../lz77/)-compressed (type 1). The loader path and the palette layer are specified. The meaning of the node contents is not established, because no code that was read consumes them.

## Load arguments

144 entries are character-sprites entries: 66 whole containers (45 + 1 + 19 + 1), 75 standalone section entries and 3 `BMAGIC` blocks. 44 more `BPLCHAR` type-0 entries at `0x8003B800` are 16,384-byte blocks of zeros. They are fillers, classed `reserve`, not character sprites.

The load argument of a character-sprites entry tells which part of the container it holds ([EMI load argument](../emi/#load-argument)).

| Family          | Type | Load argument | Entries | Payload                                                                         |
| --------------- | ---: | ------------- | ------: | ------------------------------------------------------------------------------- |
| `BPLCHAR`       |    1 | `0x8003B800`  |      45 | whole container, LZ77                                                           |
| `BPLCHAR`       |    0 | `0x8003B800`  |       1 | whole container (raw)                                                           |
| `BPLCHAR`       |    0 | `0x8003B80C`  |      19 | section 0                                                                       |
| `BPLCHAR`       |    0 | `0x8005680C`  |      13 | section 1 (section 0 is 110,592 bytes)                                          |
| `BPLCHAR`       |    0 | `0x8005F80C`  |      17 | section 1 (section 0 is 147,456 bytes)                                          |
| `BPLCHAR`       |    0 | `0x8007180C`  |      13 | section 2 (sections 0 and 1 are 110,592 bytes each)                             |
| `BPLCHAR`       |    0 | `0x8007A80C`  |      13 | section 2 (section 1 is `0x24000`)                                              |
| `BPLCHAR`       |    0 | `0x8003B800`  |      44 | filler of zeros, 16,384 bytes (`reserve`)                                       |
| `PLCHAR`        |    1 | `0x8003B800`  |      19 | whole container, LZ77, per-character sizes                                      |
| `ETC` (`START`) |    1 | `0x8003B800`  |       1 | whole container, LZ77, per-character sizes                                      |
| `BMAGIC`        |    0 | `0x8003B800`  |       3 | one 34,924-byte block with head `u32 4`; identical in `KAIZAR_D`, `_F` and `_N` |
| `PLCHAR`        |    0 | `0x801CE400`  |      19 | not sprite data: 4,676 to 9,932 bytes of MIPS code                              |

The five `BPLCHAR` section addresses are `0x8003B800` plus the container offsets `0x0C`, `0x1B00C`, `0x2400C`, `0x3600C` and `0x3F00C`. A `BPLCHAR` archive ships either the whole container at `0x8003B800` or one section at its position. `PLCHAR` splits the container from its code. `PLxxx.EMI` holds the audio entries and the packed container, and `PLPxxx.EMI` holds a per-character code overlay at `0x801CE400` (6,616 bytes and 27 functions for `PLP012`). The overlay's entry point is a dispatcher through its own tail table (`0x801CE404`, `0x801CFD80`). No `PLP` payload reads the bank.

## Container

A container is a three-word header followed by three sections.

| Offset | Size | Type     | Name             | Meaning                                                          |
| -----: | ---: | -------- | ---------------- | ---------------------------------------------------------------- |
| `0x00` |   12 | `u32[3]` | `section_offset` | offsets of sections 0 to 2; `section_offset[0]` is always `0x0C` |
| `0x0C` |    - | -        | `sections`       | section 0, then section 1, then section 2                        |

```c
typedef struct CharacterSprites {
    /* 0x00 */ u32 section_offset[CHARACTER_SPRITES_SECTION_COUNT];
} CharacterSprites;                 /* 0x0C bytes */
```

Source: [`include/game/character.h`](https://github.com/raulcorreia7/bof3-decomp/blob/main/include/game/character.h)

Section *n* runs to the start of section *n+1*, and section 2 runs to the end of the body. This holds for all 65 decoded type-1 payloads and `BPLU349`, a raw container: `header[0] == 0x0C` in 66 of 66, and the three offsets tile the body exactly. `BPLU349`, a raw container, has a 331,788-byte payload: the offsets `0x0C`, `0x1B00C` and `0x3600C`, then 3 x 110,592 bytes.

Section sizes depend on the family. The packed-only containers (`PLCHAR` 19, `ETC/START` 1) use per-character sizes (75,724, 73,708, 120,724, 59,252, 82,728 and so on). `BPLCHAR` containers use slot sizes of 110,592 (`0x1B000`) or 147,456 (`0x24000`) bytes in 136 of their 138 sections, and two `DRG*` sections are smaller (11,796 and 17,400). The fixed slot size lets a `BPLCHAR` archive ship one section at a fixed address.

## Section

A section starts with a count and the offset of its palette table.

| Offset | Size | Type  | Name             | Meaning                                                                                |
| -----: | ---: | ----- | ---------------- | -------------------------------------------------------------------------------------- |
| `0x00` |    4 | `u32` | `unk_00`         | 16 in all 198 container sections and in the 75 standalone sections; no reader names it |
| `0x04` |    4 | `u32` | `palette_offset` | section-relative byte offset of the palette table                                      |

```c
typedef struct CharacterSpritesSection {
    /* 0x00 */ u32 unk_00;
    /* 0x04 */ u32 palette_offset;
} CharacterSpritesSection;          /* 8 bytes */
```

Source: [`include/game/character.h`](https://github.com/raulcorreia7/bof3-decomp/blob/main/include/game/character.h)

## Node table

No reader names the word that locates the 16 node offsets, and the `+0x04` word is the palette table offset, not the node table. The offsets below are read from the section data. The offsets are not ascending. In `BPLD012` section 0 the table holds `0x976C 0x97B0 0xACD8 0x3C 0x378 ...  0x7B28`, which is the sorted order rotated by 13. In the 198 container sections, 3,070 of 3,168 table values fall inside their section (at least `0x30` and below the section size), and 187 sections hold 16 distinct values. The remaining 98 values are small numbers or values with a high 16-bit field (`0x100080`, `0x200080`, `0x500080`, `0x28000000`), so a table entry may be a `flags | offset` pair. The flag bits are not decoded.

## Node

A node is the unit that the table points to. Most nodes hold one image-shaped record behind a 16-byte prefix. Offsets in the table count from the start of the node.

| Offset | Size | Type  | Name     | Meaning                                                                |
| -----: | ---: | ----- | -------- | ---------------------------------------------------------------------- |
| `0x00` |   16 | -     | `prefix` | layout unknown                                                         |
| `0x10` |    2 | `u16` | `tag`    | `0x0080`, present in 2,476 of 3,070 nodes                              |
| `0x12` |    2 | `u16` | `width`  | multiple of 8 in all 2,476 tagged records (8 to 80)                    |
| `0x14` |    4 | `u32` | `count`  | 1 or 2 in all 2,476                                                    |
| `0x18` |    4 | `u32` | `size`   | equal to `width * 0x100` in 1,507 of 1,718 records with a nonzero size |
| `0x1C` |    - | -     | `body`   | the record body                                                        |

The 16 bytes before the tag have no known layout. Some nodes hold four more in-section offsets there, others packed bytes or zeros. Whether they are a child list, a per-node header or the tail of the previous record is `[unknown]`. 592 of the in-range table values show no `0x0080` halfword in the 64 bytes that follow.

One node is not image-shaped. The `BPLD012` section 0 node at `0x976C` is 68 bytes: `u32 4`, then 64 bytes with no tag. It reads like a palette or parameter block (`0x7FFF` at `+0x1A`, halfwords `0x6583 0x5104 0x28A5 0x6B94`, and small values `0x0190`, `0x0234` and `0x02DB` near its end). The three `BMAGIC` blocks open with the same `u32 4`. Whether they are containers without a container header or single nodes is `[unknown]`.

The pixel and script formats inside a node are not decoded.

## Palette layer

The word at section `+4` is the offset of the section's palette table, relative to the section. The table starts with the word `4n` for `n` palettes, followed by the palette offsets `4n + 0x40k`. Each palette is 32 16-bit colors. `n` is 1, 2 or 8 in all 141 character-sprites entries (66 containers with three tables each, and 75 sections). The three `BMAGIC` blocks do not have this layout and stay raw.

`GFX_LoadPalette (exe/slus_004_22@0x80166C48)` copies palette `mode` into the palette RAM of a work slot (`0x80035600 + slot * 0x40`). It reads the section from work `+0x4C`, which `Party_LoadMemberSprite (emi/etc/game/00@0x801C1254)` stages. The callers seen pass `mode` 0, except `func_8019C664 (emi/etc/game/00@0x8019C664)`, which passes 1.

The palette tables can be changed and written back over the decoded container, and every other byte stays the same.

## Loading

The loader copies a type-0 entry to the load argument and queues a type-1 entry for decoding ([loader chain](../emi/#loader-chain)). A type-1 entry streams to the load argument and decodes in place, so the container's sections arrive at their final RAM addresses in one step. A type-0 entry is a plain copy of a whole container, one section or the 16,384-byte filler.

## Readers

The field-side reader `Party_LoadMemberSprite` reads the container's section offsets (the word at `0x8003B800 + idx * 4`, plus `0x8003B800`) and stores the section in work `+0x4C`. The section number is the character's position in its party combination: `Party_LoadMemberSprite` searches the three character ids of the loaded row of `D_80181B34` for the actor's character and uses the position as the section index ([party combinations](../../concepts/loading/#characters-and-the-party)). `GFX_LoadPalette` reads `section+4` (the palette table), then `table[field]`, and copies 32 colors.

## Open questions

| Question                                                                                                                                                      | What would settle it                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Readers of the `BPLCHAR` section addresses `0x8005680C`, `0x8007180C` and `0x8007A80C`                                                                        | a battle overlay that reads them. The field reader forms its base with `lui` and `ori` (`0x801C12D0`), so a search must fold `ori` pairs as well as `addiu`. No payload or executable contains the little-endian word of any load argument |
| Who consumes the loader's published destinations (`D_80146844`, `D_8014677C`, `0x801464B8`)                                                                   | a reader in an overlay; none is known                                                                                                                                                                                                      |
| Who uploads the pixels: `LoadImage` has 8 direct `jal` sites, all in `exe/slus_004_22`, and no overlay uploads an image                                       | a trace of the node bytes to a primitive                                                                                                                                                                                                   |
| The node's 16-byte prefix; the tag `0x0080` (`width`, `count`, `size = width * 0x100`); `flags \| offset` table entries; the pixel or script format of a node | a reader of node fields in battle or field code                                                                                                                                                                                            |
| Whether the five `BPLCHAR` section addresses are the battle reader's section positions                                                                        | The field reader picks section *n* for the *n*-th character of the party combination; a battle overlay that reads the five addresses would settle the battle side                                                                          |

## Sources and confidence

- **Confidence:** medium. The container, the section tables and the palette layer hold on every character-sprites entry, but the node prefix, the table flags and the pixel and script formats are not decoded.
- **Evidence:** the 144 character-sprites entries including all 65 decoded type-1 payloads, the loader chain, and the field-side readers `Party_LoadMemberSprite` and `GFX_LoadPalette`.

## Related

- [EMI container](../emi/): the entry types and the load argument that place a container.
- [Type-1 LZ77 payload](../lz77/): the compressed form of most containers.
- [Disc and files](../disc/): the `BPLCHAR` and `PLCHAR` directories and their slot ids.
- [Graphics formats](../graphics/): the color word and the VRAM upload that the sprites use.
- [Edit characters and enemies](../../guides/characters/): what can change in a character.
