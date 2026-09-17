
import { useState } from 'react';
import {
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert(
        'Login Required',
        'Please enter your email address and password.'
      );
      return;
    }

    // Temporary login for the MVP.
    // Supabase authentication will replace this later.
    router.replace('/dsac/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Government colour strip */}
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
              <Text style={styles.govEmblemText}>SA</Text>
            </View>

            <View style={styles.govTextContainer}>
              <Text style={styles.republicText}>
                REPUBLIC OF SOUTH AFRICA
              </Text>

              <Text style={styles.departmentText}>
                Department of Sport, Arts and Culture
              </Text>
            </View>
          </View>

          {/* Main login area */}
          <View style={styles.mainContainer}>
            <View style={styles.brandSection}>
              <Text style={styles.civitTrack}>CIVITRACK</Text>

              <View style={styles.orangeLine} />

              <Text style={styles.platformTitle}>
                Public Funding & Accountability Platform
              </Text>

              <Text style={styles.platformDescription}>
                Secure digital accountability workspace for funded
                organisations and Department officials.
              </Text>
            </View>

            {/* Login card */}
            <View style={styles.loginCard}>
              <View style={styles.cardTopBar} />

              <Text style={styles.loginTitle}>Sign in</Text>

              <Text style={styles.loginSubtitle}>
                Access your accountability workspace
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#8A8A8A"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>PASSWORD</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8A8A8A"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              </Pressable>

              <Pressable
                style={styles.forgotButton}
                onPress={() => Alert.alert(
                  'Password Reset',
                  'Password recovery will be connected to Supabase authentication.'
                )}
              >
                <Text style={styles.forgotText}>
                  Forgot your password?
                </Text>
              </Pressable>
            </View>

            {/* Security information */}
            <View style={styles.securityBox}>
              <View style={styles.securityIcon}>
                <Text style={styles.lockIcon}>✓</Text>
              </View>

              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>
                  SECURE ACCESS
                </Text>

                <Text style={styles.securityText}>
                  Access is restricted to authorised DSAC and organisation
                  users. Your organisation workspace and information remain
                  protected.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>
              Department of Sport, Arts and Culture
            </Text>

            <Text style={styles.footerText}>
              CIVITRACK Accountability Workspace
            </Text>

            <Text style={styles.footerCopyright}>
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
    backgroundColor: '#F5F5F2',
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  /* =========================
     SOUTH AFRICAN COLOUR STRIP
     ========================= */

  flagStrip: {
    height: 7,
    flexDirection: 'row',
    width: '100%',
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

  /* =========================
     GOVERNMENT HEADER
     ========================= */

  govHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },

  govEmblem: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#007A4D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFB81C',
  },

  govEmblemText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  govTextContainer: {
    marginLeft: 14,
    flex: 1,
  },

  republicText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#222222',
  },

  departmentText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },

  /* =========================
     MAIN
     ========================= */

  mainContainer: {
    width: '100%',
    maxWidth: 850,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  brandSection: {
    alignItems: 'center',
    marginBottom: 30,
  },

  civitTrack: {
    fontSize: 35,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#111111',
  },

  orangeLine: {
    width: 75,
    height: 5,
    backgroundColor: '#FFB81C',
    marginTop: 10,
    marginBottom: 12,
  },

  platformTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#007A4D',
  },

  platformDescription: {
    maxWidth: 600,
    textAlign: 'center',
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
    lineHeight: 21,
  },

  /* =========================
     LOGIN CARD
     ========================= */

  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 30,
    borderWidth: 1,
    borderColor: '#DDDDDD',

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
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  loginTitle: {
    marginTop: 5,
    fontSize: 27,
    fontWeight: '800',
    color: '#1A1A1A',
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
    fontSize: 11,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    borderRadius: 3,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    color: '#222222',
    fontSize: 15,
  },

  loginButton: {
    height: 52,
    backgroundColor: '#007A4D',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3,
    marginTop: 5,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    fontWeight: '600',
  },

  /* =========================
     SECURITY
     ========================= */

  securityBox: {
    flexDirection: 'row',
    marginTop: 22,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
    borderLeftColor: '#FFB81C',
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },

  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007A4D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  securityTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#222222',
    letterSpacing: 0.7,
  },

  securityText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
  },

  /* =========================
     FOOTER
     ========================= */

  footer: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 25,
    alignItems: 'center',
    marginTop: 'auto',
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  footerText: {
    marginTop: 5,
    color: '#BBBBBB',
    fontSize: 12,
  },

  footerCopyright: {
    marginTop: 12,
    color: '#777777',
    fontSize: 11,
  },
});

