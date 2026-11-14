# Store delivery

How Vocabula gets from this repo to the App Store and Google Play, and
which accounts are needed before anything can ship.

## Accounts (prerequisites, done once)

| Account | Cost | Unblocks |
|---|---|---|
| Apple Developer Program (Individual) | $99/year | iOS device ad-hoc builds, TestFlight, App Store submission. Enrollment of the same Apple ID used for Xcode signing keeps the local workflow; expect the personal team ID to change to the paid team after enrollment |
| Google Play Console | $25 once | Play testing tracks (internal, closed, open) and store submission |
| Expo account (`expo.dev`, used by `eas`) | Free | `eas init` and cloud builds |

## Build pipeline

`eas.json` defines three profiles; all of them build from this exact
repository state, so a store artifact and a test build only differ by
profile - never by machine setup.

- **development** (`npx eas build --profile development`) - a dev-client
  build like the local `expo run:ios/android` ones: Metro hot reload,
  debug menus. Used to install a fresh dev client without a local Xcode
  or Android Studio.
- **preview** (`npx eas build --profile preview`) - release-mode code
  installed directly on devices, for testing the real thing before the
  stores. Android builds an installable APK; iOS builds an ad-hoc IPA
  installable on the devices registered in the ad hoc profile (the free
  7-day Xcode profiles are gone for good).
- **production** (`npx eas build --profile production`) - store
  artifacts: Android `app-bundle`, iOS archive for App Store Connect.
  `autoIncrement` keeps `versionCode`/`buildNumber` managed by EAS, and
  the human-readable version stays `app.json`'s `expo.version`.

First use on a machine: `npx eas login` (Expo account), then `npx eas
init` once to bind this repo to an EAS project.

## iOS credentials (managed by EAS)

The Apple Developer Program membership is bound to the same Apple ID as
the local Xcode workflow. EAS holds the build credentials on Expo's
servers, created once and reused by every build:

- **Distribution certificate + ad-hoc provisioning profile** - generated
  interactively on the first `eas build` (one Apple ID login with 2FA;
  the session is cached roughly a month, and future builds run on the
  stored credentials without it).
- **App Store Connect API key** (Team key, access App Manager) - stored
  locally outside the repo; covers certificate/profile generation and
  `eas submit`.
- **Ad-hoc devices** - registered by UDID during the first build; adding
  a tester's device later is the same flow.

Two iOS specifics worth remembering:

- Builds must run with `EXPO_NO_CAPABILITY_SYNC=1`. EAS syncs the App ID
  capabilities with `app.json` and would try to switch **Sign in with
  Apple off** (the app declares no Apple entitlements - social sign-in
  goes through the Cognito hosted UI). That capability must stay **on**
  in the Apple console: it backs the Services ID that Cognito's Apple
  sign-in uses.
- `app.json` sets `ITSAppUsesNonExemptEncryption: false` - the answer to
  the export-compliance question (the app only uses standard OS
  encryption, HTTPS/TLS). Submissions inherit it, so App Store Connect
  does not nag on every release.

Known CLI quirk: some `eas` commands re-serialize `app.json` and
re-add `android.permissions` from the stale local `android/` folder
(which predates `blockedPermissions`). Discard the permissions block if
it reappears; the microphone stays blocked.

## Still ahead of a first store submission

- [ ] Real logo artwork, then icon / splash / Android adaptive icon swap
- [ ] Cognito hosted-UI branding (logo + colors)
- [x] Sign in with Apple (required by App Store review when Google/LinkedIn
      sign-in is offered) - Cognito-side done and tested
- [ ] Privacy declarations: App Store privacy label and Play data-safety
      form (email, notebook photos, generated content)
- [ ] `submit` profiles in `eas.json` (App Store Connect / Play API keys)
- [ ] Store listings: screenshots, description, keywords (FR + EN)
