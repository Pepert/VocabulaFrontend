import { exchangeCodeAsync, makeRedirectUri, useAutoDiscovery, useAuthRequest } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { COGNITO } from '../config';
import { loadSession, saveSession } from '../auth';

/**
 * Deep link Cognito redirects to after sign-in. In development builds this
 * resolves to the app's registered scheme (vocabula://callback); it is listed
 * as a callback URL on the Cognito app client.
 */
function useRedirectUri(): string {
  return useMemo(() => makeRedirectUri({ native: COGNITO.nativeCallback }), []);
}

export default function SignInScreen() {
  const router = useRouter();
  const discovery = useAutoDiscovery(COGNITO.issuer);
  const redirectUri = useRedirectUri();
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: COGNITO.clientId,
      scopes: [...COGNITO.scopes],
      redirectUri,
      responseType: 'code',
      usePKCE: true,
    },
    discovery
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Skip straight to the profile screen.
  useEffect(() => {
    loadSession().then((session) => {
      if (session) {
        router.replace('/home');
      }
    });
  }, [router]);

  // Exchange the authorization code for tokens once the browser flow returns.
  // The pool client is public (no secret) and the flow uses PKCE, so the
  // exchange happens in the app.
  useEffect(() => {
    if (result?.type !== 'success' || !discovery || !request || !busy) {
      return;
    }

    exchangeCodeAsync(
      {
        clientId: COGNITO.clientId,
        code: result.params.code!,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier ?? '' },
      },
      discovery
    )
      .then(async (tokens) => {
        await saveSession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken ?? undefined,
          issuedAt: tokens.issuedAt,
          expiresIn: tokens.expiresIn,
        });
        router.replace('/home');
      })
      .catch((e: unknown) => {
        setError(String(e));
        setBusy(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, busy]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vocabula</Text>
      <Text style={styles.subtitle}>Personalized stories for language learners</Text>
      <View style={styles.button}>
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Button
            disabled={!request}
            title="Sign in"
            onPress={() => {
              setError(null);
              setBusy(true);
              promptAsync();
            }}
          />
        )}
      </View>
      {error && <Text style={styles.error}>Sign-in failed: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
  },
  button: {
    marginTop: 32,
    width: 220,
  },
  error: {
    color: '#b00020',
  },
});
