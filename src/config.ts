/**
 * Central configuration for the Vocabula app.
 *
 * Values point at the production backend deployed from the Vocabula repo
 * (see docs/architecture/aws-deployment.md there). The Cognito app client id
 * is a public identifier, not a secret; the access token it receives is.
 */
export const API_URL = 'https://api.vocabula.dev';

export const COGNITO = {
  /** Cognito hosted UI domain, used for the OAuth sign-in flow. */
  hostedUiUrl: 'https://vocabula-prod.auth.eu-west-3.amazoncognito.com',
  /** App client id of "vocabula-app" in the user pool. */
  clientId: 'ln2cjlpn66bt33ll76ipssqdv',
  /** Region of the user pool. */
  region: 'eu-west-3',
} as const;
