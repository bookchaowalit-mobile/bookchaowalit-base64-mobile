# Base64 — Mobile

React Native mobile app (Expo) for **Base64**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Features

- **Encode / decode** (home tab): live conversion between UTF-8 text (Thai,
  emoji, etc.) and Base64 as you type.
- **URL-safe mode** (RFC 4648 §5: `-`/`_`, no padding); decoding accepts both
  alphabets, missing padding and embedded whitespace.
- Clear error messages for invalid Base64 or bytes that are not valid UTF-8,
  and a one-tap "use output as input" swap.
- Pure, dependency-free implementation in `lib/base64.ts` (no `Buffer`/`btoa`),
  tested against the RFC 4648 vectors.

## Getting Started

```bash
npm ci
npx expo start
```

## Validation

```bash
npm run validate   # expo lint + tsc --noEmit + vitest
npx expo export --platform android --output-dir dist   # bundle smoke check
```

Pure logic lives in `lib/` and is unit-tested with Vitest (`lib/*.test.ts`).
CI (`.github/workflows/build.yml`) runs all of the above and fails on errors;
the EAS preview build is owner-triggered (`workflow_dispatch`) and needs the
`EXPO_TOKEN` secret plus the committed `eas.json`.

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/base64-frontend](https://github.com/bookchaowalit-website/base64-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
