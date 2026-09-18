import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const {
    signIn,
    signOut,
    loading: authLoading,
    isAuthenticated,
    role,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  /*
   * If a valid authenticated session already exists,
   * send the user to the correct dashboard.
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    navigateByRole(role);
  }, [
    authLoading,
    isAuthenticated,
    role,
  ]);

  function navigateByRole(userRole) {
    switch (userRole) {
      case 'DSAC_ADMIN':
        router.replace('/dsac/dashboard');
        break;

      case 'DSAC_REVIEWER':
        router.replace('/reviewer/dashboard');
        break;

      case 'ORG_ADMIN':
      case 'ORG_STAFF':
      case 'EXTERNAL_COLLABORATOR':
        router.replace('/organisation/dashboard');
        break;

      default:
        console.warn(
          'Unknown CIVITRACK role:',
          userRole
        );
        break;
    }
  }

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    setLoading(true);

    try {
      console.log('CIVITRACK: Starting login...');

      const result = await signIn(
        cleanEmail,
        password
      );

      console.log(
        'CIVITRACK: Login result:',
        result.success
      );

      if (!result.success) {
        Alert.alert(
          'Login failed',
          result.error ||
            'Unable to sign in.'
        );
        return;
      }

      if (!result.profile) {
        await signOut();

        Alert.alert(
          'Access denied',
          'Your CIVITRACK profile could not be found.'
        );
        return;
      }

      if (!result.profile.is_active) {
        await signOut();

        Alert.alert(
          'Account inactive',
          'Your CIVITRACK account is inactive.'
        );
        return;
      }

      const userRole = result.profile.role;

      console.log(
        'CIVITRACK: Verified role:',
        userRole
      );

      if (!userRole) {
        await signOut();

        Alert.alert(
          'Access denied',
          'Your account does not have a CIVITRACK role.'
        );
        return;
      }

      navigateByRole(userRole);
    } catch (error) {
      console.error(
        'CIVITRACK login error:',
        error
      );

      Alert.alert(
        'Login failed',
        error?.message ||
          'Unable to sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#123B63"
        />

        <Text style={styles.loadingText}>
          Loading CIVITRACK...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.content}>

        <Text style={styles.logo}>
          CIVITRACK
        </Text>

        <Text style={styles.tagline}>
          Public Funding & Accountability Platform
        </Text>

        <View style={styles.card}>

          <Text style={styles.title}>
            Sign in
          </Text>

          <Text style={styles.subtitle}>
            Access your CIVITRACK account.
          </Text>

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#98A2B3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={styles.input}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#98A2B3"
            secureTextEntry
            editable={!loading}
            style={styles.input}
          />

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[
              styles.button,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Sign In
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                '/auth/forgot-password'
              )
            }
            disabled={loading}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>
              Forgot password?
            </Text>
          </Pressable>

        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#123B63',
  },

  tagline: {
    marginTop: 8,
    marginBottom: 30,
    textAlign: 'center',
    color: '#667085',
  },

  card: {
    width: '100%',
    maxWidth: 430,
    padding: 28,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#123B63',
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#667085',
  },

  label: {
    marginTop: 12,
    marginBottom: 7,
    fontWeight: '600',
    color: '#344054',
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#101828',
  },

  button: {
    height: 52,
    marginTop: 26,
    borderRadius: 8,
    backgroundColor: '#123B63',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  forgotButton: {
    alignItems: 'center',
    marginTop: 18,
  },

  forgotText: {
    color: '#123B63',
    fontWeight: '600',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FA',
  },

  loadingText: {
    marginTop: 12,
    color: '#667085',
  },
});