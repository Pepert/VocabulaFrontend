/**
 * Central configuration for the Vocabula app.
 *
 * Values point at the production backend deployed from the Vocabula repo
 * (see docs/architecture/aws-deployment.md there). The Cognito app client id
 * is a public identifier, not a secret; the access token it receives is.
 */
import type { AppLanguage } from './i18n';

export const API_URL = 'https://api.vocabula.dev';

export const COGNITO = {
  /** OIDC issuer of the user pool; the discovery document is served from it. */
  issuer: 'https://cognito-idp.eu-west-3.amazonaws.com/eu-west-3_ef1uEzee6',
  /** Hosted UI domain, used for signing out of the browser session. */
  hostedUiDomain: 'https://auth.vocabula.dev',
  /** App client id of "vocabula-app" in the user pool. */
  clientId: 'ln2cjlpn66bt33ll76ipssqdv',
  /** Deep link Cognito redirects to after sign-in and sign-out (registered in the app client). */
  nativeCallback: 'vocabula://callback',
  /** OAuth scopes requested on sign-in (must be a subset of the client's allowed scopes). */
  scopes: ['openid', 'email'] as const,
} as const;

/** Cognito logout URL: clears the hosted UI session in the system browser. */
export function logoutUrl(): string {
  return `${COGNITO.hostedUiDomain}/logout?client_id=${COGNITO.clientId}&logout_uri=${encodeURIComponent(COGNITO.nativeCallback)}`;
}

/**
 * Cognito managed login localizes its pages through the `lang` query
 * parameter on the authorize URL (e.g. `&lang=fr`); it then persists the
 * choice in a cookie. Maps the app's UI language to that extra parameter.
 */
export function cognitoLangExtraParams(language: AppLanguage): Record<string, string> {
  return { lang: language };
}

/** Key used to persist the auth session in the device keychain. */
export const SESSION_STORAGE_KEY = 'vocabula.auth';
