# Tooling

Use Node.js >=22.12.0 and pnpm 10.8.0. Versions are pinned in the workspace catalog:

| Tool                                                             | Version                     | Command                           |
| ---------------------------------------------------------------- | --------------------------- | --------------------------------- |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter/config)          | 1.89.0                      | `pnpm lint` / `pnpm lint:fix`     |
| [Oxfmt](https://oxc.rs/docs/guide/usage/formatter/config)        | 0.74.0                      | `pnpm format` / `pnpm format:fix` |
| [TSRS](https://github.com/oxc-project/tsrs/releases/tag/v0.18.0) | 0.18.0-ts7.1.0-dev.20260929 | `pnpm check:type`                 |

`pnpm lint:workspace` remains a separate Sherif workspace-integrity check. Turbo still checks dependencies before dependents through `^check:type`; each of the five application/library workspaces runs `tsrs --noEmit` with its existing tsconfig. Vite handles application builds. TypeScript 5.9.3 remains installed for tooling and compiler-API compatibility, but is not the type-check gate. Oxlint type-aware/Go-based checking is not enabled.

## Formatting and lint policy

Oxfmt preserves two-space indentation, double quotes, no statement semicolons, ES5 trailing commas and 80-column wrapping. [Import sorting](https://oxc.rs/docs/guide/usage/formatter/sorting) is enabled without reordering side-effect imports; Oxlint checks unused imports and type-only import consistency. Import grouping, named-specifier order and fixes are not byte-for-byte equivalent to Biome import organization.

Tailwind v4 sorting reads `packages/ui/src/styles/globals.css`, including `cn`, `clsx` and `cva` calls. Its official Tailwind ordering differs from Biome's algorithm. As before, vendored web particles are exempt from class sorting. Oxfmt may produce different line breaks, and now also formats Markdown and YAML; the generated pnpm lockfile is excluded.

Both tools exclude public assets, `*.json.tmp` and generated `routeTree.gen.ts` files, and respect Git ignores. Vendored shadcn components and web particles retain their accessibility, array-index-key and loose-equality exceptions; particles also permit explicit `any`. Array-index keys elsewhere remain warnings, and non-null assertions remain allowed. Inline suppressions use Oxlint directives.

Oxlint uses its native correctness rules plus explicit equality, const/var, type-import, explicit-any and React-hook checks. Its correctness preset is **not** a one-to-one translation of Biome's recommended preset. Biome-only rules and CSS/JSON lint diagnostics are not provided by Oxlint; Oxfmt still parses/formats supported non-JavaScript files. In particular, Biome's `useSemanticElements` has no behavior-compatible replacement: Oxlint's `prefer-tag-over-role` rejects existing valid live-region roles and is disabled. `control-has-associated-label`, React `purity` and `set-state-in-effect` are additional checks beyond the previous policy and are not enabled. Noninteractive-element checking uses the click/mouse-button/keyboard handlers from the previous policy, not focus/blur events. No application behavior was changed to adopt new lint rules.

Pre-commit uses simple-git-hooks and lint-staged: JavaScript/TypeScript files run Oxlint fixes followed by Oxfmt; supported non-source files run Oxfmt only. Generated/ignored files do not fail unmatched-file checks. CI retains format, lint, type-check, unit-test, build and extension-E2E gates. No editor configuration was previously committed; use the official [Oxlint](https://oxc.rs/docs/guide/usage/linter/editors) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter/editors) editor integrations instead of Biome.

## TSRS compatibility

TSRS is the published **oxc-project/tsrs** Rust compiler, not the unrelated Rust-to-TypeScript binding generator `ts-rs`, and not tsgo. [Release-specific compatibility](https://github.com/oxc-project/tsrs/blob/v0.18.0/docs/COMPATIBILITY.md) and [CLI usage](https://github.com/oxc-project/tsrs/blob/v0.18.0/docs/USAGE.md) are authoritative.

This experimental release follows TypeScript `7.1.0-dev.20260930.4`, not TypeScript 5.9. Its native npm binaries support Apple Silicon macOS and Linux x64/arm64 (glibc/musl), including the Linux x64 CI runner. Windows and Intel macOS do not have native binaries in this published version. Do not infer released support from upstream main's 0.19.0 beta preparation.

Before replacing the checker, TypeScript 5.9.3 and the pinned TSRS release both passed all five unchanged workspaces. This is project validation, not proof of universal equivalence: upstream documents diagnostic-order/history differences, unsupported `--init`/`--showConfig`, English-only diagnostics and language-server/API gaps. Future upgrades should repeat the project comparison and verify that a deliberately invalid included TypeScript file makes the gate fail.
