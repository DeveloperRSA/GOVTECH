import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
   * If a valid session already exists,
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

  const handleLogin = async () => {
    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Login Required',
        'Please enter your email address and password.'
      );
      return;
    }

    setLoading(true);

    try {
      console.log(
        'CIVITRACK: Starting login...'
      );

      const result = await signIn(
        cleanEmail,
        password
      );

      if (!result.success) {
        Alert.alert(
          'Login Failed',
          result.error ||
            'Unable to sign in.'
        );
        return;
      }

      if (!result.profile) {
        await signOut();

        Alert.alert(
          'Access Denied',
          'Your CIVITRACK profile could not be found.'
        );
        return;
      }

      if (!result.profile.is_active) {
        await signOut();

        Alert.alert(
          'Account Inactive',
          'Your CIVITRACK account is inactive.'
        );
        return;
      }

      const userRole =
        result.profile.role;

      console.log(
        'CIVITRACK: Verified role:',
        userRole
      );

      if (!userRole) {
        await signOut();

        Alert.alert(
          'Access Denied',
          'Your account does not have a CIVITRACK role.'
        );
        return;
      }

      navigateByRole(userRole);
    } catch (error) {
      console.error(
        'CIVITRACK Login Error:',
        error
      );

      Alert.alert(
        'Login Error',
        error?.message ||
          'Something went wrong while signing in.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#007A4D"
        />

        <Text style={styles.loadingText}>
          Loading CIVITRACK...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* South African inspired colour strip */}
          <View style={styles.flagStrip}>
            <View style={styles.blackStrip} />
            <View style={styles.goldStrip} />
            <View style={styles.greenStrip} />
            <View style={styles.blueStrip} />
            <View style={styles.redStrip} />
          </View>

          {/* Government header */}
          <View style={styles.govHeader}>
            <View style={styles.govEmblem}>
              <Text style={styles.govEmblemText}>
                SA
              </Text>
            </View>

            <View style={styles.govText}>
              <Text style={styles.republic}>
                REPUBLIC OF SOUTH AFRICA
              </Text>

              <Text style={styles.department}>
                Department of Sport, Arts and Culture
              </Text>
            </View>
          </View>

          <View style={styles.mainContainer}>
            <View style={styles.brandSection}>
              <Text style={styles.brandName}>
                CIVITRACK
              </Text>

              <View style={styles.orangeLine} />

              <Text style={styles.platformTitle}>
                Public Funding & Accountability Platform
              </Text>

              <Text style={styles.description}>
                Secure digital accountability workspace for
                Department officials and funded organisations.
              </Text>
            </View>

            {/* Login card */}
            <View style={styles.loginCard}>
              <View style={styles.cardTopBar} />

              <Text style={styles.loginTitle}>
                Sign in
              </Text>

              <Text style={styles.loginSubtitle}>
                Access your accountability workspace
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  EMAIL ADDRESS
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#888888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  PASSWORD
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#888888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed &&
                    styles.buttonPressed,
                  loading &&
                    styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.loginButtonText
                    }
                  >
                    SIGN IN
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
                  Forgot your password?
                </Text>
              </Pressable>
            </View>

            {/* Security */}
            <View style={styles.securityBox}>
              <View style={styles.securityIcon}>
                <Text style={styles.check}>
                  ✓
                </Text>
              </View>

              <View
                style={
                  styles.securityContent
                }
              >
                <Text
                  style={
                    styles.securityTitle
                  }
                >
                  SECURE ACCESS
                </Text>

                <Text
                  style={
                    styles.securityText
                  }
                >
                  Only authorised users can access CIVITRACK.
                  Organisation users can only access information
                  belonging to their organisation.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>
              CIVITRACK
            </Text>

            <Text style={styles.footerText}>
              Public Funding & Accountability Platform
            </Text>

            <Text style={styles.footerText}>
              Department of Sport, Arts and Culture
            </Text>

            <Text
              style={styles.footerCopyright}
            >
              © 2026 Republic of South Africa
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F1',
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  flagStrip: {
    height: 7,
    flexDirection: 'row',
  },

  blackStrip: {
    flex: 1,
    backgroundColor: '#111111',
  },

  goldStrip: {
    flex: 1,
    backgroundColor: '#FFB81C',
  },

  greenStrip: {
    flex: 2,
    backgroundColor: '#007A4D',
  },

  blueStrip: {
    flex: 1,
    backgroundColor: '#001489',
  },

  redStrip: {
    flex: 1,
    backgroundColor: '#DE3831',
  },

  govHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },

  govEmblem: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#007A4D',
    borderWidth: 4,
    borderColor: '#FFB81C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  govEmblemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  govText: {
    marginLeft: 14,
    flex: 1,
  },

  republic: {
    color: '#222222',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  department: {
    color: '#666666',
    fontSize: 14,
    marginTop: 5,
  },

  mainContainer: {
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 45,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 28,
  },

  brandName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#111111',
  },

  orangeLine: {
    width: 75,
    height: 5,
    backgroundColor: '#FFB81C',
    marginVertical: 10,
  },

  platformTitle: {
    color: '#007A4D',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  description: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 560,
    marginTop: 9,
  },

  loginCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    padding: 30,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cardTopBar: {
    height: 5,
    backgroundColor: '#007A4D',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },

  loginTitle: {
    marginTop: 5,
    fontSize: 27,
    fontWeight: '800',
    color: '#171717',
  },

  loginSubtitle: {
    marginTop: 6,
    marginBottom: 27,
    color: '#777777',
    fontSize: 14,
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#333333',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    color: '#222222',
    fontSize: 15,
  },

  loginButton: {
    height: 52,
    backgroundColor: '#007A4D',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  forgotButton: {
    alignItems: 'center',
    marginTop: 20,
  },

  forgotText: {
    color: '#007A4D',
    fontSize: 13,
    fontWeight: '700',
  },

  securityBox: {
    marginTop: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderLeftWidth: 5,
    borderLeftColor: '#FFB81C',
    flexDirection: 'row',
  },

  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007A4D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  securityContent: {
    flex: 1,
    marginLeft: 12,
  },

  securityTitle: {
    color: '#222222',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  securityText: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  footer: {
    backgroundColor: '#111111',
    paddingVertical: 28,
    alignItems: 'center',
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerText: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 5,
  },

  footerCopyright: {
    color: '#666666',
    fontSize: 10,
    marginTop: 12,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F1',
  },

  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
});
