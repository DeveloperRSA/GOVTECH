
import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';
import { ROLES } from '../../src/constants/roles';

export default function OrganisationsScreen() {
  const {
    profile,
    user,
    role,
    loading: authLoading,
  } = useAuth();

  const [showForm, setShowForm] = useState(false);

  // Organisation details
  const [organisationName, setOrganisationName] = useState('');
  const [organisationType, setOrganisationType] = useState('NPO');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');

  // First Organisation Admin details
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [adminPasswordVisible, setAdminPasswordVisible] = useState(false);

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /*
   * Load organisations from Supabase
   */
  const loadOrganisations = useCallback(async () => {
    try {
      setLoading(true);

      console.log('LOAD ORGANISATIONS: starting');

      const { data, error } = await supabase
        .from('organisations')
        .select(`
          id,
          name,
          organisation_type,
          registration_number,
          email,
          phone,
          province,
          status,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        });

      console.log('LOAD ORGANISATIONS: response', {
        data,
        error,
      });

      if (error) {
        throw error;
      }

      setOrganisations(data || []);
    } catch (error) {
      console.error('Organisation loading error:', error);

      Alert.alert(
        'Unable to Load',
        'Organisations could not be loaded from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (
        !authLoading &&
        user &&
        role === ROLES.DSAC_ADMIN
      ) {
        loadOrganisations();
      }
    }, [
      authLoading,
      user,
      role,
      loadOrganisations,
    ])
  );

  /*
   * Reset the complete organisation form
   */
  const resetForm = () => {
    setOrganisationName('');
    setOrganisationType('NPO');
    setRegistrationNumber('');
    setEmail('');

    setAdminFullName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminPasswordConfirm('');
    setAdminPasswordVisible(false);

    setShowForm(false);
  };

  /*
   * Create organisation + first Organisation Admin
   */
  const createOrganisation = async () => {
    console.log(
      'CREATE ORGANISATION: BUTTON FUNCTION STARTED'
    );

    /*
     * Make sure the user is authenticated
     */
    if (!user) {
      console.log('CREATE ORGANISATION: NO USER');

      Alert.alert(
        'Authentication Required',
        'You must be signed in to create an organisation.'
      );

      return;
    }

    console.log(
      'CREATE ORGANISATION: USER FOUND',
      user.id
    );

    /*
     * Make sure user is DSAC Admin
     */
    if (role !== ROLES.DSAC_ADMIN) {
      console.log(
        'CREATE ORGANISATION: ACCESS DENIED',
        role
      );

      Alert.alert(
        'Access Denied',
        'Only a DSAC administrator can create organisations.'
      );

      return;
    }

    console.log(
      'CREATE ORGANISATION: DSAC ADMIN VERIFIED'
    );

    /*
     * Organisation validation
     */
    if (
      !organisationName.trim() ||
      !registrationNumber.trim() ||
      !email.trim()
    ) {
      console.log(
        'CREATE ORGANISATION: ORGANISATION VALIDATION FAILED'
      );

      Alert.alert(
        'Missing Organisation Information',
        'Please complete the organisation name, registration number and organisation email.'
      );

      return;
    }

    /*
     * Email validation
     */
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      console.log(
        'CREATE ORGANISATION: ORGANISATION EMAIL INVALID',
        email
      );

      Alert.alert(
        'Invalid Organisation Email',
        'Please enter a valid organisation email address.'
      );

      return;
    }

    /*
     * Admin validation
     */
    if (
      !adminFullName.trim() ||
      !adminEmail.trim() ||
      !adminPassword ||
      !adminPasswordConfirm
    ) {
      console.log(
        'CREATE ORGANISATION: ADMIN VALIDATION FAILED'
      );

      Alert.alert(
        'Missing Administrator Information',
        'Please complete the Organisation Administrator name, email, password and password confirmation.'
      );

      return;
    }

    /*
     * Admin email validation
     */
    if (!emailPattern.test(adminEmail.trim())) {
      console.log(
        'CREATE ORGANISATION: ADMIN EMAIL INVALID',
        adminEmail
      );

      Alert.alert(
        'Invalid Administrator Email',
        'Please enter a valid Organisation Administrator email address.'
      );

      return;
    }

    /*
     * Password validation
     */
    if (adminPassword.length < 8) {
      console.log(
        'CREATE ORGANISATION: PASSWORD TOO SHORT'
      );

      Alert.alert(
        'Password Too Short',
        'The temporary password must contain at least 8 characters.'
      );

      return;
    }

    /*
     * Confirm password
     */
    if (adminPassword !== adminPasswordConfirm) {
      console.log(
        'CREATE ORGANISATION: PASSWORDS DO NOT MATCH'
      );

      Alert.alert(
        'Passwords Do Not Match',
        'The temporary password and confirmation password must match.'
      );

      return;
    }

    console.log(
      'CREATE ORGANISATION: ALL VALIDATION PASSED'
    );

    try {
      setSaving(true);

      console.log(
        'CREATE ORGANISATION: SAVING STATE ENABLED'
      );

      /*
       * --------------------------------
       * CHECK DUPLICATE REGISTRATION
       * --------------------------------
       */

      console.log(
        'CREATE ORGANISATION: CHECKING DUPLICATE REGISTRATION'
      );

      const {
        data: existingOrganisation,
        error: duplicateError,
      } = await supabase
        .from('organisations')
        .select('id')
        .eq(
          'registration_number',
          registrationNumber.trim()
        )
        .maybeSingle();

      console.log(
        'CREATE ORGANISATION: DUPLICATE CHECK RESPONSE',
        {
          existingOrganisation,
          duplicateError,
        }
      );

      if (duplicateError) {
        throw duplicateError;
      }

      if (existingOrganisation) {
        console.log(
          'CREATE ORGANISATION: DUPLICATE FOUND'
        );

        Alert.alert(
          'Organisation Already Exists',
          'An organisation with this registration number already exists.'
        );

        return;
      }

      /*
       * --------------------------------
       * CREATE ORGANISATION
       * --------------------------------
       */

      console.log(
        'CREATE ORGANISATION: ABOUT TO INSERT ORGANISATION'
      );

      const { data, error } = await supabase
        .from('organisations')
        .insert({
          name: organisationName.trim(),
          organisation_type: organisationType,
          registration_number: registrationNumber.trim(),
          email: email.trim().toLowerCase(),
          status: 'ACTIVE',
          created_by: profile?.id || user.id,
        })
        .select()
        .single();

      console.log(
        'CREATE ORGANISATION: ORGANISATION INSERT FINISHED'
      );

      console.log(
        'CREATE ORGANISATION: INSERT DATA',
        data
      );

      console.log(
        'CREATE ORGANISATION: INSERT ERROR',
        error
      );

      if (error) {
        console.error(
          'Organisation insert error:',
          error
        );

        throw error;
      }

      if (!data?.id) {
        throw new Error(
          'The organisation was created but its ID could not be retrieved.'
        );
      }

      console.log(
        'CREATE ORGANISATION: ORGANISATION CREATED SUCCESSFULLY',
        data.id
      );

      /*
       * --------------------------------
       * CREATE ORGANISATION ADMIN
       * --------------------------------
       *
       * Password is sent only to the
       * secure server-side Edge Function.
       */

      console.log(
        'CREATE ORGANISATION: CALLING EDGE FUNCTION'
      );

      console.log(
        'CREATE ORGANISATION: FUNCTION PAYLOAD',
        {
          organisationId: data.id,
          fullName: adminFullName.trim(),
          email: adminEmail.trim().toLowerCase(),
        }
      );

      const {
        data: functionData,
        error: functionError,
      } = await supabase.functions.invoke(
        'create-organisation-admin',
        {
          body: {
            organisationId: data.id,
            fullName: adminFullName.trim(),
            email: adminEmail.trim().toLowerCase(),
            password: adminPassword,
          },
        }
      );

      console.log(
        'CREATE ORGANISATION: EDGE FUNCTION FINISHED'
      );

      console.log(
        'CREATE ORGANISATION: EDGE FUNCTION DATA',
        functionData
      );

      console.log(
        'CREATE ORGANISATION: EDGE FUNCTION ERROR',
        functionError
      );

      /*
       * --------------------------------
       * EDGE FUNCTION ERROR
       * --------------------------------
       */

      if (functionError) {
        console.error(
          'Organisation admin function error:',
          functionError
        );

        Alert.alert(
          'Administrator Creation Failed',
          `The organisation "${data.name}" was created, but the Organisation Administrator could not be created.\n\n${
            functionError.message ||
            'Please check the Edge Function.'
          }`
        );

        await loadOrganisations();

        return;
      }

      /*
       * --------------------------------
       * EDGE FUNCTION RESPONSE ERROR
       * --------------------------------
       */

      if (!functionData?.success) {
        console.error(
          'Organisation admin provisioning failed:',
          functionData
        );

        Alert.alert(
          'Administrator Creation Failed',
          functionData?.error ||
            'The Organisation Administrator could not be created.'
        );

        await loadOrganisations();

        return;
      }

      /*
       * --------------------------------
       * EVERYTHING SUCCESSFUL
       * --------------------------------
       */

      console.log(
        'CREATE ORGANISATION: EVERYTHING SUCCESSFUL'
      );

      Alert.alert(
        'Organisation Created Successfully',
        `${data.name} has been registered in CIVITRACK and ${adminFullName.trim()} has been created as the Organisation Administrator.`
      );

      /*
       * Reset form
       */
      resetForm();

      /*
       * Reload organisations
       */
      await loadOrganisations();
    } catch (error) {
      console.error(
        'Organisation creation error:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'The organisation could not be created.';

      Alert.alert(
        'Creation Failed',
        message
      );
    } finally {
      console.log(
        'CREATE ORGANISATION: SAVING STATE DISABLED'
      );

      setSaving(false);
    }
  };

  /*
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return '—';
    }

    return value.toLocaleDateString(
      'en-ZA',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  /*
   * Authentication loading state
   */
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#111111"
        />

        <View style={styles.loadingState}>
          <ActivityIndicator
            size="large"
            color="#007A4D"
          />

          <Text style={styles.loadingText}>
            Checking administrator access...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * User is not authenticated
   */
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#111111"
        />

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Authentication Required
          </Text>

          <Text style={styles.emptyText}>
            Please sign in before accessing organisation management.
          </Text>

          <Pressable
            style={styles.emptyButton}
            onPress={() =>
              router.replace('/auth/login')
            }
          >
            <Text style={styles.emptyButtonText}>
              GO TO LOGIN
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * User is authenticated but not DSAC Admin
   */
  if (role !== ROLES.DSAC_ADMIN) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#111111"
        />

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Access Denied
          </Text>

          <Text style={styles.emptyText}>
            Only authorised DSAC administrators can manage organisations.
          </Text>

          <Pressable
            style={styles.emptyButton}
            onPress={() =>
              router.replace('/dsac/dashboard')
            }
          >
            <Text style={styles.emptyButtonText}>
              RETURN TO DASHBOARD
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#111111"
      />

      <ScrollView>
        {/* Government colour strip */}
        <View style={styles.flagStrip}>
          <View style={styles.black} />
          <View style={styles.gold} />
          <View style={styles.green} />
          <View style={styles.blue} />
          <View style={styles.red} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.replace('/dsac/dashboard')
            }
          >
            <Text style={styles.back}>
              ← Dashboard
            </Text>
          </Pressable>

          <View>
            <Text style={styles.headerBrand}>
              CIVITRACK
            </Text>

            <Text style={styles.headerSubtitle}>
              DSAC Accountability Workspace
            </Text>
          </View>
        </View>

        {/* Main */}
        <View style={styles.main}>
          {/* Heading */}
          <View style={styles.heading}>
            <View style={styles.headingContent}>
              <Text style={styles.title}>
                Organisations
              </Text>

              <Text style={styles.description}>
                Register and manage NPOs and Public Entities
                participating in DSAC-funded programmes.
              </Text>
            </View>

            <Pressable
              style={styles.createButton}
              onPress={() =>
                setShowForm(!showForm)
              }
              disabled={saving}
            >
              <Text style={styles.createButtonText}>
                + CREATE ORGANISATION
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formTop} />

              <Text style={styles.formTitle}>
                Register Organisation
              </Text>

              <Text style={styles.formDescription}>
                Only authorised DSAC administrators can create
                organisations and provision their first
                Organisation Administrator.
              </Text>

              {/* ORGANISATION DETAILS */}
              <Text style={styles.sectionFormTitle}>
                ORGANISATION DETAILS
              </Text>

              {/* Organisation name */}
              <Text style={styles.label}>
                ORGANISATION NAME *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter organisation name"
                placeholderTextColor="#888888"
                value={organisationName}
                onChangeText={setOrganisationName}
                editable={!saving}
              />

              {/* Organisation type */}
              <Text style={styles.label}>
                ORGANISATION TYPE *
              </Text>

              <View style={styles.typeRow}>
                {/* NPO */}
                <Pressable
                  style={[
                    styles.typeButton,
                    organisationType === 'NPO' &&
                      styles.selectedType,
                  ]}
                  onPress={() =>
                    setOrganisationType('NPO')
                  }
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.typeText,
                      organisationType === 'NPO' &&
                        styles.selectedTypeText,
                    ]}
                  >
                    NPO
                  </Text>
                </Pressable>

                {/* Public Entity */}
                <Pressable
                  style={[
                    styles.typeButton,
                    organisationType === 'PUBLIC_ENTITY' &&
                      styles.selectedType,
                  ]}
                  onPress={() =>
                    setOrganisationType(
                      'PUBLIC_ENTITY'
                    )
                  }
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.typeText,
                      organisationType === 'PUBLIC_ENTITY' &&
                        styles.selectedTypeText,
                    ]}
                  >
                    PUBLIC ENTITY
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.typeHint}>
                {organisationType === 'NPO'
                  ? 'Non-Profit Organisation participating in a DSAC-funded programme.'
                  : 'Public Entity participating in a DSAC-funded programme.'}
              </Text>

              {/* Registration number */}
              <Text style={styles.label}>
                REGISTRATION NUMBER *
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  organisationType === 'NPO'
                    ? 'e.g. NPO registration number'
                    : 'e.g. public entity registration/reference number'
                }
                placeholderTextColor="#888888"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                editable={!saving}
              />

              {/* Organisation email */}
              <Text style={styles.label}>
                ORGANISATION EMAIL *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="organisation@example.org"
                placeholderTextColor="#888888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!saving}
              />

              {/* ORGANISATION ADMIN */}
              <View style={styles.adminSection}>
                <Text style={styles.sectionFormTitle}>
                  FIRST ORGANISATION ADMINISTRATOR
                </Text>

                <Text style={styles.adminDescription}>
                  This user will receive access to the organisation
                  workspace and will manage the organisation's staff.
                </Text>

                {/* Admin full name */}
                <Text style={styles.label}>
                  ADMINISTRATOR FULL NAME *
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter administrator full name"
                  placeholderTextColor="#888888"
                  value={adminFullName}
                  onChangeText={setAdminFullName}
                  editable={!saving}
                />

                {/* Admin email */}
                <Text style={styles.label}>
                  ADMINISTRATOR EMAIL *
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="admin@example.org"
                  placeholderTextColor="#888888"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!saving}
                />

                {/* Temporary password */}
                <Text style={styles.label}>
                  TEMPORARY PASSWORD *
                </Text>

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#888888"
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                    secureTextEntry={!adminPasswordVisible}
                    autoCapitalize="none"
                    editable={!saving}
                  />

                  <Pressable
                    style={styles.passwordButton}
                    onPress={() =>
                      setAdminPasswordVisible(
                        !adminPasswordVisible
                      )
                    }
                    disabled={saving}
                  >
                    <Text style={styles.passwordButtonText}>
                      {adminPasswordVisible
                        ? 'HIDE'
                        : 'SHOW'}
                    </Text>
                  </Pressable>
                </View>

                {/* Confirm password */}
                <Text style={styles.label}>
                  CONFIRM TEMPORARY PASSWORD *
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Re-enter temporary password"
                  placeholderTextColor="#888888"
                  value={adminPasswordConfirm}
                  onChangeText={setAdminPasswordConfirm}
                  secureTextEntry={!adminPasswordVisible}
                  autoCapitalize="none"
                  editable={!saving}
                />

                <View style={styles.securityNotice}>
                  <Text style={styles.securityNoticeTitle}>
                    🔒 SECURITY
                  </Text>

                  <Text style={styles.securityNoticeText}>
                    The password is sent directly to Supabase
                    Authentication through the secure server-side
                    provisioning function. It is not stored in the
                    CIVITRACK database.
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.formActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={resetForm}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>
                    CANCEL
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.saveDisabled,
                  ]}
                  onPress={createOrganisation}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />

                      <Text style={styles.savingText}>
                        CREATING...
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.saveText}>
                      CREATE ORGANISATION
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Information */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>
                i
              </Text>
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Organisation access
              </Text>

              <Text style={styles.infoText}>
                Organisations do not self-register. A DSAC
                administrator creates the organisation and
                provisions its first Organisation Administrator.
                The organisation may be an NPO or a Public Entity.
              </Text>
            </View>
          </View>

          {/* Registered organisations */}
          <Text style={styles.sectionTitle}>
            REGISTERED ORGANISATIONS
          </Text>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                size="large"
                color="#007A4D"
              />

              <Text style={styles.loadingText}>
                Loading organisations...
              </Text>
            </View>
          ) : organisations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                +
              </Text>

              <Text style={styles.emptyTitle}>
                No organisations yet
              </Text>

              <Text style={styles.emptyText}>
                Create the first organisation to begin the
                CIVITRACK accountability workflow.
              </Text>

              <Pressable
                style={styles.emptyButton}
                onPress={() =>
                  setShowForm(true)
                }
              >
                <Text style={styles.emptyButtonText}>
                  CREATE FIRST ORGANISATION
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.organisationList}>
              {organisations.map(
                (organisation) => (
                  <View
                    key={organisation.id}
                    style={styles.organisationCard}
                  >
                    <View style={styles.organisationTop} />

                    <View style={styles.organisationHeader}>
                      <View
                        style={
                          styles.organisationHeaderContent
                        }
                      >
                        <Text
                          style={
                            styles.organisationName
                          }
                        >
                          {organisation.name}
                        </Text>

                        <Text
                          style={
                            styles.organisationRegistration
                          }
                        >
                          {organisation.registration_number}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.typeBadge,
                          organisation.organisation_type ===
                            'PUBLIC_ENTITY' &&
                            styles.publicEntityBadge,
                        ]}
                      >
                        <Text
                          style={
                            styles.typeBadgeText
                          }
                        >
                          {organisation.organisation_type ===
                          'PUBLIC_ENTITY'
                            ? 'PUBLIC ENTITY'
                            : 'NPO'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          organisation.status === 'ACTIVE' &&
                            styles.activeBadge,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {organisation.status ||
                            'UNKNOWN'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.organisationDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                          TYPE
                        </Text>

                        <Text style={styles.detailValue}>
                          {organisation.organisation_type ===
                          'PUBLIC_ENTITY'
                            ? 'Public Entity'
                            : 'NPO'}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                          EMAIL
                        </Text>

                        <Text style={styles.detailValue}>
                          {organisation.email || '—'}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>
                          REGISTERED
                        </Text>

                        <Text style={styles.detailValue}>
                          {formatDate(
                            organisation.created_at
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              )}
            </View>
          )}
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

          <Text style={styles.footerCopyright}>
            © 2026 Republic of South Africa
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F3F0',
  },

  flagStrip: {
    height: 7,
    flexDirection: 'row',
  },

  black: {
    flex: 1,
    backgroundColor: '#111111',
  },

  gold: {
    flex: 1,
    backgroundColor: '#FFB81C',
  },

  green: {
    flex: 2,
    backgroundColor: '#007A4D',
  },

  blue: {
    flex: 1,
    backgroundColor: '#001489',
  },

  red: {
    flex: 1,
    backgroundColor: '#DE3831',
  },

  header: {
    backgroundColor: '#111111',
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    color: '#FFB81C',
    fontWeight: '800',
    fontSize: 12,
  },

  headerBrand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'right',
  },

  headerSubtitle: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 3,
  },

  main: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 30,
  },

  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },

  headingContent: {
    flex: 1,
  },

  title: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '900',
  },

  description: {
    color: '#666666',
    marginTop: 7,
    fontSize: 13,
  },

  createButton: {
    backgroundColor: '#007A4D',
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginLeft: 20,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 25,
    marginBottom: 20,
    overflow: 'hidden',
  },

  formTop: {
    height: 5,
    backgroundColor: '#FFB81C',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  formTitle: {
    marginTop: 5,
    fontSize: 21,
    fontWeight: '900',
    color: '#222222',
  },

  formDescription: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 22,
    lineHeight: 18,
  },

  sectionFormTitle: {
    color: '#007A4D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
  },

  adminSection: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },

  adminDescription: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },

  label: {
    color: '#333333',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#222222',
  },

  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  typeButton: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  selectedType: {
    backgroundColor: '#007A4D',
    borderColor: '#007A4D',
  },

  typeText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
  },

  selectedTypeText: {
    color: '#FFFFFF',
  },

  typeHint: {
    color: '#888888',
    fontSize: 11,
    marginTop: 7,
    lineHeight: 16,
  },

  passwordContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#222222',
  },

  passwordButton: {
    paddingHorizontal: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#DDDDDD',
  },

  passwordButtonText: {
    color: '#007A4D',
    fontSize: 10,
    fontWeight: '900',
  },

  securityNotice: {
    marginTop: 18,
    padding: 14,
    backgroundColor: '#F4F7FA',
    borderLeftWidth: 4,
    borderLeftColor: '#007A4D',
  },

  securityNoticeTitle: {
    color: '#222222',
    fontSize: 10,
    fontWeight: '900',
  },

  securityNoticeText: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 25,
  },

  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },

  cancelText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
  },

  saveButton: {
    backgroundColor: '#007A4D',
    paddingHorizontal: 20,
    paddingVertical: 13,
    minWidth: 190,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  saveDisabled: {
    opacity: 0.7,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  savingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 5,
    borderLeftColor: '#FFB81C',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 18,
    flexDirection: 'row',
    marginBottom: 30,
  },

  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007A4D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIconText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    color: '#222222',
    fontSize: 12,
    fontWeight: '900',
  },

  infoText: {
    color: '#666666',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  sectionTitle: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  loadingState: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 10,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 45,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#007A4D',
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 42,
  },

  emptyTitle: {
    marginTop: 15,
    color: '#222222',
    fontSize: 17,
    fontWeight: '900',
  },

  emptyText: {
    marginTop: 7,
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 450,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: '#007A4D',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  organisationList: {
    gap: 12,
  },

  organisationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 20,
    overflow: 'hidden',
  },

  organisationTop: {
    height: 4,
    backgroundColor: '#007A4D',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  organisationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },

  organisationHeaderContent: {
    flex: 1,
  },

  organisationName: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '900',
  },

  organisationRegistration: {
    color: '#007A4D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E8F3EE',
  },

  publicEntityBadge: {
    backgroundColor: '#E8F0F7',
  },

  typeBadgeText: {
    color: '#007A4D',
    fontSize: 9,
    fontWeight: '900',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F3F0',
  },

  activeBadge: {
    backgroundColor: '#EFF7F3',
  },

  statusText: {
    color: '#007A4D',
    fontSize: 9,
    fontWeight: '900',
  },

  organisationDetails: {
    flexDirection: 'row',
    gap: 25,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '900',
  },

  detailValue: {
    color: '#222222',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  footer: {
    backgroundColor: '#111111',
    paddingVertical: 28,
    alignItems: 'center',
    borderTopWidth: 5,
    borderTopColor: '#007A4D',
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerText: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 5,
  },

  footerCopyright: {
    color: '#666666',
    fontSize: 9,
    marginTop: 12,
  },
});

