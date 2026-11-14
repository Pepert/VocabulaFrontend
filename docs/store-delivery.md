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
  stores. Android builds an installable APK today; the iOS side needs
  the Apple Developer Program membership (internal distribution) and will
  be wired then.
- **production** (`npx eas build --profile production`) - store
  artifacts: Android `app-bundle`, iOS archive for App Store Connect.
  `autoIncrement` keeps `versionCode`/`buildNumber` managed by EAS, and
  the human-readable version stays `app.json`'s `expo.version`.

First use on a machine: `npx eas login` (Expo account), then `npx eas
init` once to bind this repo to an EAS project.

## Still ahead of a first store submission

- [ ] Real logo artwork, then icon / splash / Android adaptive icon swap
- [ ] Cognito hosted-UI branding (logo + colors)
- [ ] Sign in with Apple (required by App Store review when Google/LinkedIn
      sign-in is offered)
- [ ] Privacy declarations: App Store privacy label and Play data-safety
      form (email, notebook photos, generated content)
- [ ] `submit` profiles in `eas.json` (App Store Connect / Play API keys)
- [ ] Store listings: screenshots, description, keywords (FR + EN)
