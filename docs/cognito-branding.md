# Cognito managed-login branding — Vocabula (auth.vocabula.dev)

How to brand the hosted sign-in page (`auth.vocabula.dev`) with the Vocabula
identity. Facts verified against docs.aws.amazon.com (2026-11-24, see bottom).
Applying is a PROD change — the owner applies it (console or AWS CLI).
No terraform drift: terraform manages pool/client/domain only, NOT branding.

## Brand assets (in `assets/branding/cognito/`)

- `vocabula-horizontal-lockup.svg` — wide lockup (glyph + wordmark) on
  transparent background; upload as `PAGE_HEADER_LOGO` (the page header).
- `cognito-header-logo.png` — square glyph on transparent, 512x512; currently
  uploaded as `FORM_LOGO` (centered above the form). Prefer the lockup in the
  header and keep this for the form if desired.
- `cognito-favicon.svg` — glyph SVG, viewBox `0 0 32 32` (category
  `FAVICON_SVG`; the API only allows ICO/SVG for favicons).

Upload each asset with ColorMode **browser-adaptive** (one file for light+dark).
Formats PNG/JPG/WEBP; 2 MB per API request (ours are tiny).

## Brand values to set (source of truth: `src/theme.ts`)

| Editor section | Field | Value |
|---|---|---|
| Page | background color | `#EFF7E6` (surfaceTint) |
| Form | background / border / radius | `#FFFFFF` / `#E5E5E5` / 12 |
| Buttons | primary background, hover, text | `#58CC02` / `#43A302` / `#FFFFFF` |
| Buttons/links | secondary / link color | `#1CB0F6` (blue) |
| Text | primary / secondary | `#3C3C3C` / `#8F8F8F` |
| Inputs | focus border | `#1CB0F6` |

Font: **not supported** — the managed-login branding settings schema has no font
component (components are: alert, favicon, form, idpButton, pageBackground,
pageFooter, pageHeader, pageText, phoneNumberSelector, primaryButton,
secondaryButton). The hosted page uses Cognito's own font stack; only the app
itself renders Nunito. Editor field labels drift between console versions — if a
label doesn't match, screenshot it before guessing.

## Current live state (verified via AWS CLI, read-only)

- Pool `eu-west-3_ef1uEzee6` ("vocabula"), tier **ESSENTIALS** (branding editor available).
- Domain `auth.vocabula.dev` ACTIVE, **ManagedLoginVersion: 1 = CLASSIC hosted UI**
  (per API docs, value **2** = managed login). So the live /login page currently
  renders the CLASSIC UI and ignores managed-login styles — the branding version
  must be switched to managed login first (see below).
- App client `ln2cjlpn66bt33ll76ipssqdv` ("vocabula-app") now has a branding style
  assigned (verified via DescribeManagedLoginBrandingByClient).

## Step 0 — switch the domain to managed login (REQUIRED, prod change)

Console: user pool -> Branding -> **Domain** -> `auth.vocabula.dev` -> Edit ->
Branding version -> **Managed login** -> Save. Or CLI:
`aws cognito-idp update-user-pool-domain --user-pool-id eu-west-3_ef1uEzee6 --domain auth.vocabula.dev --managed-login-version 2 --region eu-west-3`

Caveats (official docs): switching branding version **invalidates existing user
sessions** (everyone must sign in again) and can take **up to ~4 minutes** to
propagate through the domain's CloudFront distribution.

## How to apply

### A. Console (recommended)
Cognito console -> User pools -> `vocabula` -> App clients -> `vocabula-app` ->
"Login pages" tab -> "Launch branding editor" -> upload the 2 assets from
`assets/branding/cognito/`, set the colors above, Save. Changes go live
immediately. (To replace an existing style: delete it first, then create.)

### B. AWS CLI
```
aws cognito-idp create-managed-login-branding \
  --user-pool-id eu-west-3_ef1uEzee6 --client-id ln2cjlpn66bt33ll76ipssqdv \
  --region eu-west-3 \
  --assets fileb://assets/branding/cognito/vocabula-horizontal-lockup.svg,category=PAGE_HEADER_LOGO,colorMode=browser-adaptive \
           fileb://assets/branding/cognito/cognito-favicon.svg,category=FAVICON_SVG,colorMode=browser-adaptive \
  --settings file://branding-settings.json
```
`branding-settings.json` is a JSON Document per the branding schema; easiest way
to get a valid one is to build the style in the console first, then export via
`describe-managed-login-branding-by-client --return-merged-resources`.

## Verify

Open in INCOGNITO (multiple Google profiles on this machine):
https://auth.vocabula.dev/login?response_type=code&client_id=ln2cjlpn66bt33ll76ipssqdv&redirect_uri=vocabula://callback

Check: header logo, tint page background, green primary button, blue links,
favicon in the tab. Adding a style does NOT invalidate existing sessions
(no branding-version switch involved).

## Verified facts (docs.aws.amazon.com, 2026-11-24)

- Branding version is a DOMAIN setting (managed login vs classic hosted UI).
- Managed login + branding editor require the Essentials/Plus tier; classic
  hosted UI (SetUICustomization: logo <=100KB, CSS <=3KB) is the Lite-tier fallback.
- Branding styles are PER APP CLIENT: create/update/delete-managed-login-branding(-by-client);
  to fully replace a style, delete then create; unspecified settings are preserved
  on update; 2 MB request limit.
- Asset categories include FAVICON_ICO | FAVICON_SVG | PAGE_HEADER_LOGO |
  PAGE_BACKGROUND | FORM_LOGO | IDP_BUTTON_ICON | ...; each asset has a
  ColorMode of light | dark | browser-adaptive.
