# The editor previews its own gallery and bridge-enabled apps, never coss.com

The web editor's preview shows only our gallery (built from real coss ui components) and custom previews of apps that include our bridge script, such as a developer's localhost. It does not frame coss.com/ui: browsers block a page from styling a cross-origin frame, so coss.com could only be themed by proxying it through our domain (republishing someone else's site) or by requiring the extension. Editing live sites such as coss.com is the extension's job, through Chrome's side panel.

## Considered Options

- **Proxy coss.com through our domain and inject the bridge**: rejected; it serves coss's pages under our name, needs their consent, and breaks when their site changes.
- **Use the extension as the bridge for any framed site**: rejected for now; it ties the web editor's main preview to an install, and the side panel already covers live sites.
