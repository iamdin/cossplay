# Cossplay

Cossplay designs and applies themes for coss ui: in a browser editor against a component gallery, or live on a real coss ui website through a Chrome extension.

## Language

### Themes

**Theme**:
A complete set of token values for light and dark mode.
_Avoid_: Style, skin, palette

**Token**:
One named theme variable, such as `primary`, `destructive-foreground` or `radius`, following coss ui's token set.
_Avoid_: Variable, CSS var

**Preset**:
A ready-made theme from tweakcn, mapped onto coss ui's tokens, or coss ui's own default.
_Avoid_: Template

**Override**:
A token value that differs from the theme it was applied over; only overrides are written.
_Avoid_: Patch, diff

### Surfaces

**Editor**:
The browser app at `/editor`, laid out like tweakcn's editor: the panel on the left and the preview on the right. No extension needed.
_Avoid_: Playground, preview, demo

**Preview**:
The canvas beside the panel in the editor, showing one page that receives the theme live.
_Avoid_: Canvas, iframe, viewport

**Gallery**:
The built-in preview pages made from real coss ui components (such as Cards or Dashboard).
_Avoid_: Sample site, demo page

**Custom preview**:
A preview of the user's own app (typically on localhost) at a URL they enter, themed through the bridge.
_Avoid_: Live preview, external preview

**Bridge**:
A script a developer adds to their own app so the editor can theme it inside the preview.
_Avoid_: Embed script, snippet

**Panel**:
The editing controls (presets, tokens, typography, history, import/export) in the editor and the extension. Both offer the same editing capabilities; only the host differs.
_Avoid_: Side panel UI, sidebar

**Host**:
What the panel runs inside — the editor or the extension — which decides where the theme is applied and where it is kept.
_Avoid_: Adapter, platform, environment

**Extension**:
The Chrome extension that edits a live coss ui site directly, showing the panel in Chrome's side panel. It is not part of the editor's preview.

**Site**:
A live website, identified by its origin, whose theme the extension edits.
_Avoid_: Page, tab, domain
