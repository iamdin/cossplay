# SPEC: Cossplay launch film (storyline A, "The site changes clothes")

GOAL: A developer who builds with coss ui sees one click re-theme a real site, sees why that beats hand-editing CSS variables, and leaves knowing to "Add to Chrome".
OUTPUT: HyperFrames, 1920 x 1080, 30 fps
TIME: 24 s x 30 fps = 720 frames. Music: HeyGen catalog track, 100 BPM, beat 0.6 s = 18 frames, bar 2.4 s = 72 frames.
Sections: A 0-9.6 (quiet), B 9.6-16.8 (entrance), C 16.8-30 (peak 26.45).
LOOK: ground #f4f4f5 (zinc-100), flat, no texture; ink #18181b; secondary ink #71717a.
Accent = the preset colour on screen (Bubblegum pink #e8578f in the hook, Tangerine orange after); never a separate brand accent.
Display: Geist 600, titles 104 px (9.6% of height), tracking -0.035em; claim 120 px. Mono: Geist Mono 500, 26 px.
Medium: real product UI, 2x captures of the extension on coss.com/ui, in a browser window:
radius 16 px, 1 px #d4d4d8 border, title bar 44 px #fafafa, shadow 0 40px 90px rgba(24,24,27,0.16).
OBJECTS: the browser window (title bar with 3 grey dots and "coss.com/ui"), the coss.com/ui page, the Cossplay side panel,
a code editor card listing the site's real :root variables, the cursor (black arrow, white 3 px outline, 64 px = 6% of height),
the Cossplay mark (dark rounded square, white ring; the site favicon SVG).
MOTION: enter expo.out; move power3.inOut; camera power2.inOut 0.5-0.7 s; exit power3.in, 40% shorter than the entrance.
Clicks are tl.set hits on the beat; the cursor arrives 0.15 s early. Titles: per-word blur 6 px -> 0, 0.13 s, 0.07 s apart; landed titles never move.
SHOTS:
0.0-6.0 MONTAGE. Title "Every / coss ui site. / Any theme." left from frame 0; 2x2 grid of real pages (coss.com/ui, /ui/chat, coss.com, /ui/particles) at 0.397x.
On every beat 0.6-4.8 each page takes another preset, light and dark alternating (soft click). 5.4 title out, 5.5 grid collapses toward the panel.
6.0-8.4 REVEAL. The Cossplay panel (Tangerine) prints in, "Cossplay" per letter; the site slides in to complete the window (bass hit at 6.0).
8.4-18.0 PROOF, one bar each: "Flip it dark." / "Tune any token." / "See what it uses." / "Export Tailwind v4."
18.0-20.4 EDITOR. Cut on the bar; "No install? Open the editor." left, the web editor at 0.82x right, cursor clicks Next preset on 18.6 / 19.2 / 19.8.
20.4-24.0 END CARD. Mark pops in, wordmark, "Open the editor" + "Add to Chrome" + cossplay.vercel.app, held to 24.
BANNED: dark void ground; glow, particles; purple/blue gradients; glass cards; cream paper + serif + mono labels; three cards in a row;
title over a dimmed screenshot; logo docked in a corner; everything fading up; titles drifting after landing; invented UI
(every panel and page state is a capture); "Introducing"/"Meet" opener; "seamless", "effortless", "in seconds".
QA: 0.0 (thumbnail: menu + cursor, not empty), 1.25 (pink just after click), 2.4 (whole window pink), 6.5 (editing a hex), 10.2 (Cossplay title + panel),
12.3 (dark), 15.2 (hue mid-drag), 17.2 (inspector), 19.8 (export CSS), 22.0 (payoff), 26.0 (claim), 29.5 (end card).
