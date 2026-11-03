# Local development

How to run and develop the Vocabula app on a real iPhone from this machine.

## Prerequisites

- Node 26+ and npm
- Xcode (from the App Store) with your Apple ID added under
  **Xcode → Settings → Accounts** — a free personal account is enough
- A physical iPhone connected via USB, unlocked, with
  **Settings → Privacy & Security → Developer Mode** enabled

> Expo Go cannot be used for this app: the sign-in flow requires the app's
> own URL scheme (`vocabula://`) for the OAuth redirect, which only a
> development build can register.

## First run

```bash
npm install
npx expo run:ios --device
```

The first build takes 5–15 minutes (CocoaPods + full native compile).
Expo signs the app with your personal team; if asked to pick a team,
choose your name / "Personal Team".

On the first install the iPhone will refuse to launch the app once:

1. **Settings → General → VPN & Device Management** → your Apple ID → **Trust**
2. Relaunch the app

## Day-to-day loop

Keep the terminal running `npx expo start` (or the `run:ios` session):

- Save any `.tsx`/`.ts` file → the app on the phone reloads instantly
- A full rebuild (`npx expo run:ios --device`) is only needed after changes
  to native configuration (`app.json` config plugins, native libraries)
- Shake the phone (or press `j` in the terminal) for the developer menu

## Sign-in flow notes

- Sign-in opens the Cognito hosted UI in the system browser
  (Google / LinkedIn / email)
- Tokens are stored in the device keychain: closing and reopening the app
  keeps you signed in
- **Sign out** in the app also logs out the browser session via the Cognito
  logout endpoint, so the next sign-in shows the provider selection again
- The access token expires after 1 hour; the refresh token lasts 5 days

## Troubleshooting

- **"No code signing certificates are available to use"** — open
  `ios/VocabulaFrontend.xcworkspace` in Xcode once, select the target →
  Signing & Capabilities → pick your personal team, then rebuild
- **Repeated keychain password prompts** — your login keychain password is
  out of sync with your Mac account password; change and re-change your Mac
  password to resync
- **Build succeeds but sign-in does nothing** — check that the backend
  (api.vocabula.dev) is up: `curl https://api.vocabula.dev/health`

## Android (later)

The same code builds for Android via a cloud build (`eas build --profile
development --platform android`) or locally with Android Studio. Nothing in
this repo is iOS-specific.
