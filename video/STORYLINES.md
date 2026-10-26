# Cossplay launch film: storylines

Built with HyperFrames (heygen-com/hyperframes, `product-launch` type). Facts come from docs/store/listing.md and README.md; every screen is captured from the real extension on https://coss.com/ui and the real web editor.

The one thing: "Click a preset and your whole coss ui site changes, then take the theme with you."

## A. The site changes clothes (recommended)

Device: the feature as the hook. Form: one continuous take, the camera pushing between the site and the side panel without cutting.

- First 2 s: coss.com/ui at 1.8x, neutral. A big cursor enters from the right and clicks "Tangerine" in the Cossplay panel; on that frame the whole page turns orange.
- Beats: hook (site re-themes on a click) -> tension (the old way: 41 CSS variables in DevTools, one hex at a time) -> reveal "Cossplay" as the side panel slides in -> proof: pick a preset, flip to dark, drag Primary's hue, hover to inspect the button's tokens -> payoff: the full site cycling through presets on the beat -> claim "Any coss ui site. Your theme." -> end card: icon clicked, "Add to Chrome" + cossplay.vercel.app.
- Look: white ground, Geist, the accent is whatever preset is on screen.
- Sound: minimal pulse ~110 bpm that opens at the reveal, drops at the payoff; a soft click on every cursor action.

## B. Fitting room (bold)

Device: a character tries on outfits (the pun in the name). Form: match cuts; the "Get started" button holds centre while everything around it changes.

- First 2 s: giant type "Your site has one outfit." over the plain coss.com/ui hero.
- Beats: hook -> runway: "Look 01 Tangerine", "Look 02 Cosmic Night"... each a hard cut on the beat -> reveal: the panel is the wardrobe -> proof: tailor it (hue slider), lights off (dark), check the label (inspect) -> payoff: the export CSS rolls out as the garment tag -> end card.
- Look: magazine type, full-bleed theme colour fields, real screens only.
- Sound: runway beat ~124 bpm, hard cuts on the kick.

## C. Ship it

Device: one object across apps. Form: object-to-object chain, each shot ends on what opens the next.

- First 2 s: a developer's localhost app in plain default theme; cursor opens the Cossplay panel on it.
- Beats: hook -> pick and tune on the real site -> Export becomes a terminal: `npx shadcn add` with the @cossplay registry -> the same localhost app reloads in the new theme -> claim "Try it on the site. Ship it in your code." -> end card.
- Look: browser chrome and terminal, Geist + Geist Mono.
- Sound: low lo-fi bed, keyboard ticks in the terminal, a lift when the app reloads.

## Assumptions

30-40 s, 1920x1080 30 fps, music + click sounds, no voiceover, English on screen. Music: free local MusicGen, or HeyGen's catalog if you sign in to the `heygen` CLI.
