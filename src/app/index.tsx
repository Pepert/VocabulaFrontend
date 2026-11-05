import { exchangeCodeAsync, makeRedirectUri, useAutoDiscovery, useAuthRequest } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COGNITO } from '../config';
import { loadSession, saveSession } from '../auth';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

/**
 * Deep link Cognito redirects to after sign-in. In development builds this
 * resolves to the app's registered scheme (vocabula://callback); it is
 * listed as a callback URL on the Cognito app client.
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

  // Already signed in? Skip straight to home.
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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>V</Text>
      </View>
      <Text style={styles.title}>Vocabula</Text>
      <Text style={styles.subtitle}>Your story, written with the words you are learning.</Text>
      <View style={styles.button}>
        {busy ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <PrimaryButton
            title="Sign in"
            disabled={!request}
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
    gap: spacing.s,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.green,
    borderBottomWidth: 6,
    borderBottomColor: colors.greenEdge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  badgeText: {
    ...typography.h1,
    color: colors.white,
    fontSize: 48,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.bodyMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  button: {
    marginTop: spacing.xl,
    width: 260,
  },
  error: {
    ...typography.bodyMuted,
    color: colors.red,
    textAlign: 'center',
  },
});
