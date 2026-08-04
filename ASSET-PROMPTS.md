# BioHack Gold — asset prompts

Every generated asset in this app, with the exact prompt that made it. Paste these
into the MediaAsset `prompt` field when filing to the library. Nothing here is
guesswork — if you want a variant, edit the prompt below rather than starting over.

Generated 4 Aug 2026. Originals live in `source-media/` (kept out of git — they are
6 MB PNGs). `python3 tools/process-media.py` turns them into the web assets in
`public/media/`.

**Model note:** every image below was requested as `nano_banana_pro` and the platform
silently ran `nano_banana_2` instead. It's a known substitution; the work came back
usable but prompt adherence is lower, and the light instruction is the first thing to
drift. Worth re-running on `pro` if a shot ever comes back wrong.

**The text ban is load-bearing.** Every word on the finished page — headline, price,
compound name — is overlaid by the app. Anything baked into the pixels is wrong for
the product it lands on, can't be edited, and generated lettering is the single most
obvious AI tell. Hence the blank foil label bands: the app writes the name.

---

## Hero — the reconstitution

The showstopper. A locked-off macro watches a vial reconstitute itself: the
lyophilised cake dissolves into clear solution. One physical event, no camera tricks.

### 1. Before still — `hero-before.png` → `public/media/hero-poster.jpg`

Also the video poster and the fallback the app shows when clips are missing.
`nano_banana_pro`, 16:9, 2k. Subject line: `hero premium-dark — vial with lyophilised cake on steel bench`

> Wide 16:9 macro photograph, eye-level, slight wide-angle, shallow depth of field. A single clear glass pharmaceutical vial standing on a brushed stainless steel laboratory bench, sealed with a plain gold aluminium crimp cap, holding a dense white lyophilised powder cake at the bottom, the upper two thirds of the vial empty. Cold clinical London laboratory, dark charcoal surroundings falling off into deep shadow, a faint drift of cold vapour lying low across the steel bench. Hard directional light from the upper right raking across the glass, one crisp specular highlight down the edge of the vial, deep cool shadows, a warm gold glint off the cap. Realistic true-to-life colours, real glass and real metal, lived-in not staged. Leave the left third of the frame clear and uncluttered - plain dark background and empty bench. No people. No text anywhere in the frame - no labels, no lettering, no numbers, no barcodes, no brand marks or logos, no watermark.

### 2. After still — `hero-after.png`

Generated **from the before still** (`medias[{role: image}]`), changing only the vial
contents. This is the step that keeps the house — same vial, cap, bench, window,
light, framing — so the interpolation doesn't drift.

> Keep this photograph exactly as it is - the same vial, the same gold crimp cap, the same steel bench, the same background, the same lighting, the same framing and the same camera position. Change one thing only: the white lyophilised powder cake at the bottom of the vial is now fully dissolved, so the vial holds a completely clear colourless liquid filling the lower half, with a faint convection swirl still turning in the solution and the liquid surface catching a thin bright highlight. No powder remains. Everything else in the frame is unchanged. No people. No text anywhere in the frame - no labels, no lettering, no numbers, no barcodes, no brand marks or logos, no watermark.

### 3. The clip — `hero-01-reconstitution.mp4`

`seedance_2_0`, std, 1080p, **6s**, `generate_audio: true`, start_image = before,
end_image = after. Subject line: `transform peptide — lyophilised cake to clear solution`

Two things to know if you re-run it:

- **6s, not the usual 12s.** 12s costs 108 credits and there were 69.84 left. A
  dissolve is a single event rather than a staged multi-beat wave, so it survives the
  shorter cut better than a driveway would. Re-run at `duration: 12` when there's budget.
- **The platform tried to hijack it** with an unrelated preset called "IN THE DARK".
  Declined via `declined_preset_id: 24bae836-2c4a-48e0-89b6-49fcc0b21612`. Expect the
  same interception on any re-run.

> Static locked-off camera on a single glass vial standing on a steel laboratory bench. No camera movement, no zoom, no pan, no parallax. The vial, the gold cap, the bench, the background and the light stay exactly as they are. Inside the vial the white lyophilised powder cake dissolves in a fast, satisfying wave, like falling dominoes: the cake lifts at its edges first, then breaks into fine threads that spiral upward through clear liquid rising from the base, the solution clouding briefly before clearing from the bottom up, a slow convection swirl still turning as the last of the powder disappears. Cold vapour keeps drifting low across the steel bench throughout. By the final frame the vial holds a completely clear colourless solution and no powder remains. Real-time speed, natural physics. No people, no hands, no syringe, no needle, no tools. No text anywhere in the frame - no labels, no lettering, no numbers, no brand marks, no watermark. No title card, no caption, no end card, no overlay of any kind at any point in the clip. Sound: the soft glassy settle of liquid against the vial wall, a faint fizz as the powder breaks apart, then quiet room tone and the low hum of a laboratory fridge over the finished vial.

**No syringe, no needle, no hands** is deliberate and must stay in any re-run. A vial
being drawn from reads as administration, and this is a research supplier.

### Cycle 2 — not yet generated

`BIZ.media.cycles` declares `hero-02-coldchain.mp4`, which doesn't exist. That is
fine and intentional: the player HEAD-probes every clip and silently drops what is
missing, so the hero runs as a clean one-cycle loop until the file lands. When there
is budget, the second cycle is frost blooming across the glass on the same locked-off
frame — same before still, different after, so it reuses everything above.

---

## Product stills — four images, twenty products

Reused across the whole catalogue via `shot` on each product, mapped by research
domain in `GOAL_SHOT`. All `nano_banana_pro`, 1:1, 2k.
Subject line: `product bhg — unlabelled vial, {colour} cap`

The label band is deliberately **blank foil**: the app overlays the compound name, so
one photograph serves every product in its domain.

Common body — only the cap colour and one accent change between the four:

> Square macro photograph, eye-level, shallow depth of field. A single small clear glass pharmaceutical vial standing alone on a brushed stainless steel laboratory bench, sealed with a plain **{CAP}** aluminium crimp cap, holding a dense white lyophilised powder cake at the bottom, the upper two thirds of the vial empty. The vial carries a blank foil band with absolutely no lettering, no numbers and no markings of any kind. Cold clinical laboratory, dark charcoal background falling off into deep shadow. Hard directional light from the upper left raking across the glass, one crisp specular highlight down the edge of the vial, deep cool shadows. Realistic true-to-life colours, real glass and real metal, lived-in not staged. No people. No text anywhere in the frame - no labels, no lettering, no numbers, no barcodes, no brand marks or logos, no watermark.

| File | `{CAP}` | Extra clause | Domains it dresses |
|---|---|---|---|
| `vial-gold.webp` | `gold` | *"a blank gold foil band"*, plus `a warm gold glint off the cap` | growth, metabolic |
| `vial-green.webp` | `muted sea-green` | — | recovery |
| `vial-ice.webp` | `pale ice-blue` | `a faint bloom of frost across the lower glass` | immune, longevity |
| `vial-violet.webp` | `muted violet` | — | cognition, sleep, cosmetic |

---

## Logo

A **mark only, never a wordmark.** "BioHack Gold" is set in real type beside it.
Generated lettering is almost always subtly malformed, and a logo is the one asset
where that is fatal — so the models were told, emphatically, to produce no letters.

Both `nano_banana_pro`, 1:1, 2k, then background-cut to transparent WebP at 192px by
`tools/process-media.py`.

### In use — `logo.webp` (the seal)

Chosen because it reads as certification, which is the brand's entire trust story,
and it survives being shrunk to 28px in the topbar.
Subject line: `logo bhg — molecular ring seal, gold on black`

> Flat vector logo mark, perfectly centred on a solid near-black background. A circular laboratory seal: a fine molecular chain of small nodes and connecting bonds bent into a complete ring, with a single solid gold droplet form resting at the centre of the ring, rendered in warm brushed gold with clean precise geometry and even line weight. Minimal, authoritative, reads as a certification stamp. Generous empty margin around the mark. Absolutely no text, no letters, no words, no numbers, no monogram, no initials, no lettering of any kind, no watermark, no signature. Symbol only, flat graphic design, no photograph, no 3D rendering, no drop shadow.

### Alternate — `logo-chain.webp` (the peptide chain)

Bolder and more distinctive, better for a favicon or a large mark; less obviously
about verification. Swap by pointing `BIZ.logo` at it.
Subject line: `logo bhg — interlocking hexagon chain, gold on black`

> Flat vector logo mark, perfectly centred on a solid near-black background. An abstract emblem built from a short chain of four interlocking hexagons that curve into a rising arc, suggesting a peptide chain, rendered in a single warm brushed-gold gradient with clean precise geometry and even line weight. Minimal, confident, pharmaceutical and premium. Generous empty margin around the mark. Absolutely no text, no letters, no words, no numbers, no monogram, no initials, no lettering of any kind, no watermark, no signature. Symbol only, flat graphic design, no photograph, no 3D rendering, no drop shadow.

---

## The reveal page seal — `hello/assets/seal.webp`

For Karl's private reveal page at `/hello/`. He taps it to break the sterile
seal and open his venture. `nano_banana_pro`, 1:1, 2k, then cut to transparent
at 640px by `tools/process-media.py` (lower threshold than the logos — shot on
pure black, and the seal's own shadowed rim has to survive the cut or it gains
a hard bright edge).

Subject line: `seal bhg — brushed gold crimp cap, K struck`

**The single letter is the one exception to the no-text rule**, and it is a
calculated one: a lone capital is far more reliable than a word, and the same
trick worked on Karl Gardner's wax seal. It still needs checking at full
resolution every time — if the K ever comes back malformed, empty
`BIZ.sealImage` and the built-in SVG cap takes over with no other changes.

**Chosen (A):**

> Square photograph shot from directly overhead, macro, of a pharmaceutical vial's gold aluminium flip-off crimp seal lying flat on a pure solid black background. Brushed warm gold metal, a finely knurled milled edge running all the way around the rim, a raised smooth circular centre button, and a single capital letter K deeply debossed into the centre of that button. Hard raking light from the upper left picking out the knurling and catching the edge of the debossed letter, deep shadow sitting in the recesses, shallow depth of field. Photorealistic, real brushed metal, not an illustration, not a render. Perfectly centred and square on, the seal filling most of the frame with a generous black margin all round. The only marking anywhere on the seal is that single capital letter K - absolutely no other text, no words, no numbers, no logos, no brand marks, no watermark.

**Runner-up (B)** — `source-media/seal-b.png`. Aged, warmer, serif K, closer to
a wax seal. Rejected because the serif belongs to a different client's identity
and the clinical brushed finish suits this brand better. Swap the filename in
`tools/process-media.py` to use it.

> Square photograph shot from directly overhead, macro, of an antique gold sealed vial cap resting on a pure solid black background. Aged warm gold metal with a soft satin finish and faint fine scratches from handling, a crimped milled rim, a domed centre medallion, and one single capital letter K struck deep into the middle of the medallion like a pressed seal. Low warm directional light from the left raking hard across the metal so the struck letter throws its own shadow, deep blacks, shallow depth of field. Photorealistic macro photograph of real metal, not an illustration, not a 3D render. Perfectly centred and square on, generous black margin all round. The only marking anywhere on the cap is that single capital letter K - absolutely no other text, no words, no numbers, no logos, no brand marks, no watermark.

---

## Still owed

- `hero-02-coldchain.mp4` — cycle 2, frost blooming across the glass (see above).
- `public/media/m/` — 720p mobile encodes of every clip. The player already looks for
  them and falls back to the desktop list, so this is optimisation, not a blocker.
- `ambience.m4a` — the looping bed that runs under the clip joins. Without it the
  audio drops to silence at every loop and the seam becomes audible. Only matters
  once there is more than one cycle.
