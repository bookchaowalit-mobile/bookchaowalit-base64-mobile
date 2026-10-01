# Upgrade Plan

## Current state

- Before this pass: **2/10** — Expo template scaffold with placeholder
  screens; CI masked every failure with `|| true`; lint failed; the app could
  not be bundled (missing `expo-asset`, `query-string`, outdated
  `expo-router`); `app.json` referenced icon files that do not exist.
- After this pass: **7/10** — real core feature, tested pure logic,
  honest CI, app bundles for Android.

## Backlog

### P0
- Add real app icons (`assets/icon.png`, `assets/adaptive-icon.png`) and
  reference them from `app.json` before any store build.

### P1
- Copy output button (`expo-clipboard`, JS API in Expo Go) with a "copied" live-region message.
- Add component tests (jest-expo + @testing-library/react-native) for the
  main screen.
- Dark-mode palette (`userInterfaceStyle` is `automatic` but colors are
  hard-coded light).

### P2
- Sync with the web frontend's API once one exists.
- Upgrade Expo SDK (clears remaining `npm audit` findings in Expo tooling).

## Done in this pass

- Home tab is a live UTF-8 Base64 encoder/decoder with URL-safe mode, strict validation and swap; dependency-free lib tested against RFC 4648 vectors.
- Pure logic in `lib/` with Vitest unit tests (`npm test`).
- CI now runs `npm ci`, lint, typecheck, tests and an Android bundle export
  with no failure masking; EAS preview build is owner-triggered only and
  `eas.json` is committed.
- Added `eslint.config.js`, `typecheck`/`test`/`validate` scripts and a
  committed `package-lock.json`.
- Fixed dependencies so Metro can bundle (SDK 53-aligned `expo-router`,
  `react-native`, `expo-constants`; added `expo-asset`, `expo-font`,
  `query-string`).
- `app.json`: removed references to missing icon files.
- Removed the placeholder Explore tab.

## Done in this pass (pass 2)

Score: 6/10 (unchanged) — hardening pass. Persistence P0 intentionally dropped: users paste tokens and credentials into Base64 tools, so input is kept in memory only (decision recorded here).

- Privacy/robustness: input is never persisted; the field disables autocomplete, spell-check and Android autofill; conversion is capped at `MAX_INPUT_CHARS` (100k) so a huge paste cannot freeze the JS thread (tested).
- Accessibility: buttons/segment darkened to #2F6DB5 and meta text to #666 for WCAG AA with white/small text; profile links get link roles.
- Advisories: `overrides.postcss ^8.5.28` clears the high-severity PostCSS advisory in Expo metro-config (minor bump). Remaining `image-size` (metro, bundler-only), `uuid` (via `xcode`) and `decode-uri-component` (via `query-string@7`) need an Expo SDK major upgrade; deliberately not auto-fixed.
- Verified: typecheck, lint, 17 vitest tests, Android `expo export` bundle.

## Done in this pass (pass 3)

Score: 8/10 (was 7.5/10) — edge-case hunt in `lib/base64.ts`.

- Bug: text containing a lone surrogate (half an emoji, common after a truncated paste) was encoded as CESU-8 bytes, so "Use output as input" then failed with "not valid UTF-8". Lone surrogates now encode as U+FFFD, like `TextEncoder`.
- Bug: the size line counted UTF-16 units ("🎨" = 2 characters). New `sizeLabel` counts code points, pluralises, and shows the UTF-8 byte size when it differs.
- Regression tests for lone surrogates, 4-byte emoji, BOM / NBSP / U+2028 inside pasted Base64.
- Verified: typecheck, lint, 21 vitest tests, Android `expo export`.
