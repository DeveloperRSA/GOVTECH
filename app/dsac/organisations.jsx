import React, { useCallback, useState } from 'react';


import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import ProtectedRoute from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';

const ORANGE = '#D97706';
const DARK = '#222222';
const GREEN = '#007A4D';
const BLUE = '#003DA5';
const RED = '#D22B2B';
const GOLD = '#FFB81C';
const WHITE = '#FFFFFF';
const LIGHT = '#F5F5F5';
const BORDER = '#D9D9D9';
const MUTED = '#666666';

const ROLES = {
  DSAC_ADMIN: 'DSAC_ADMIN',
};

const EMPTY_FORM = {
  organisationName: '',
  organisationType: 'NPO',
  registrationNumber: '',
  email: '',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
  confirmPassword: '',
};

export default function OrganisationsScreen() {
  return (
    <ProtectedRoute>
      <OrganisationsContent />
    </ProtectedRoute>
  );
}

function OrganisationsContent() {
  const { width } = useWindowDimensions();

  const {
    profile,
    user,
    role,
    authLoading,
  } = useAuth();

  const isDesktop = width >= 900;

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [creating, setCreating] = useState(false);

  const [activeNav, setActiveNav] = useState('organisations');

  const isDsacAdmin =
    role === ROLES.DSAC_ADMIN ||
    profile?.role === ROLES.DSAC_ADMIN ||
    user?.role === ROLES.DSAC_ADMIN;

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowAdminPassword(false);
    setShowConfirmPassword(false);
  };

  const closeCreateForm = () => {
    resetForm();
    setShowCreateForm(false);
  };

  const loadOrganisations = useCallback(async () => {
    try {
      setLoading(true);

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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading organisations:', error);
        throw error;
      }

      setOrganisations(data || []);
    } catch (error) {
      Alert.alert(
        'Unable to Load Organisations',
        error?.message || 'Something went wrong while loading organisations.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading && isDsacAdmin) {
        loadOrganisations();
      }
    }, [authLoading, isDsacAdmin, loadOrganisations])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrganisations();
  };

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const createOrganisation = async () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please sign in again before creating an organisation.'
      );
      return;
    }

    if (!isDsacAdmin) {
      Alert.alert(
        'Access Denied',
        'Only DSAC administrators can register organisations.'
      );
      return;
    }

    const organisationName = form.organisationName.trim();
    const registrationNumber = form.registrationNumber.trim();
    const email = form.email.trim();
    const adminFullName = form.adminFullName.trim();
    const adminEmail = form.adminEmail.trim();
    const adminPassword = form.adminPassword;
    const confirmPassword = form.confirmPassword;

    if (!organisationName) {
      Alert.alert('Required Field', 'Please enter the organisation name.');
      return;
    }

    if (!registrationNumber) {
      Alert.alert(
        'Required Field',
        'Please enter the organisation registration number.'
      );
      return;
    }

    if (!email) {
      Alert.alert(
        'Required Field',
        'Please enter the organisation email address.'
      );
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid organisation email address.'
      );
      return;
    }

    if (!adminFullName) {
      Alert.alert(
        'Required Field',
        'Please enter the first organisation administrator’s full name.'
      );
      return;
    }

    if (!adminEmail) {
      Alert.alert(
        'Required Field',
        'Please enter the administrator email address.'
      );
      return;
    }

    if (!isValidEmail(adminEmail)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid administrator email address.'
      );
      return;
    }

    if (!adminPassword) {
      Alert.alert(
        'Required Field',
        'Please create a password for the organisation administrator.'
      );
      return;
    }

    if (adminPassword.length < 8) {
      Alert.alert(
        'Password Too Short',
        'The administrator password must contain at least 8 characters.'
      );
      return;
    }

    if (adminPassword !== confirmPassword) {
      Alert.alert(
        'Passwords Do Not Match',
        'The administrator passwords do not match.'
      );
      return;
    }

    try {
      setCreating(true);

      const {
        data: existingOrganisation,
        error: duplicateError,
      } = await supabase
        .from('organisations')
        .select('id')
        .eq('registration_number', registrationNumber)
        .maybeSingle();

      if (duplicateError) {
        throw duplicateError;
      }

      if (existingOrganisation) {
        Alert.alert(
          'Organisation Already Exists',
          'An organisation with this registration number is already registered.'
        );
        return;
      }

      const { data, error } = await supabase
        .from('organisations')
        .insert({
          name: organisationName,
          organisation_type: form.organisationType,
          registration_number: registrationNumber,
          email: email.toLowerCase(),
          status: 'ACTIVE',
          created_by: profile?.id || user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          'The organisation was not created because no organisation ID was returned.'
        );
      }

      const {
        error: adminError,
      } = await supabase.functions.invoke('create-organisation-admin', {
        body: {
          organisationId: data.id,
          fullName: adminFullName,
          email: adminEmail.toLowerCase(),
          password: adminPassword,
        },
      });

      if (adminError) {
        console.error(
          'Organisation created but admin creation failed:',
          adminError
        );

        resetForm();
        setShowCreateForm(false);

        await loadOrganisations();

        Alert.alert(
          'Organisation Created',
          'The organisation was registered successfully, but the organisation administrator account could not be created. Please check the administrator setup.'
        );

        return;
      }

      resetForm();
      setShowCreateForm(false);

      await loadOrganisations();

      Alert.alert(
        'Organisation Registered',
        `${organisationName} has been successfully registered and the first administrator account has been created.`
      );
    } catch (error) {
      console.error('Create organisation error:', error);

      Alert.alert(
        'Registration Failed',
        error?.message ||
          'Something went wrong while registering the organisation.'
      );
    } finally {
      setCreating(false);
    }
  };

  const navigate = (route, navName) => {
    setActiveNav(navName);
    router.push(route);
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

        <ActivityIndicator size="large" color={ORANGE} />

        <Text style={styles.loadingText}>
          Loading organisations...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

        <Text style={styles.accessTitle}>
          Authentication Required
        </Text>

        <Text style={styles.accessText}>
          Please sign in to access the organisations section.
        </Text>
      </SafeAreaView>
    );
  }

  if (!isDsacAdmin) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

        <Text style={styles.accessTitle}>
          Access Denied
        </Text>

        <Text style={styles.accessText}>
          Only DSAC administrators can access organisation management.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => router.replace('/dsac/dashboard')}
        >
          <Text style={styles.backButtonText}>
            RETURN TO DASHBOARD
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={WHITE}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ORANGE]}
            tintColor={ORANGE}
          />
        }
      >
        {/* SOUTH AFRICAN FLAG STRIP */}
        <View style={styles.flagStrip}>
          <View style={styles.flagRed} />
          <View style={styles.flagBlue} />
          <View style={styles.flagGreen} />
          <View style={styles.flagYellow} />
        </View>

        {/* GOVERNMENT HEADER */}
        <View style={styles.govHeader}>
          <View style={styles.govHeaderInner}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/sa.jpg')}
                style={styles.saLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.govTextContainer}>
              <Text style={styles.govCountry}>
                REPUBLIC OF SOUTH AFRICA
              </Text>

              <Text style={styles.govDepartment}>
                DEPARTMENT OF SPORT, ARTS AND CULTURE
              </Text>

              <Text style={styles.govSubtext}>
                GOVERNMENT OF SOUTH AFRICA
              </Text>
            </View>

            {isDesktop && (
              <View style={styles.userHeader}>
                <Text style={styles.signedInLabel}>
                  SIGNED IN AS
                </Text>

                <Text style={styles.userRole}>
                  DSAC ADMIN
                </Text>

                <Text style={styles.userEmail}>
                  {user?.email || profile?.email || 'Administrator'}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.dashboardButton}
                  onPress={() =>
                    router.push('/dsac/dashboard')
                  }
                >
                  <Text style={styles.dashboardButtonText}>
                    DASHBOARD
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SYSTEM BAR */}
        <View style={styles.systemBar}>
          <View style={styles.systemBarInner}>
            <View style={styles.systemBrand}>
              <View style={styles.systemDot} />

              <Text style={styles.systemName}>
                CIVITRACK
              </Text>

              <Text style={styles.systemDescription}>
                GOVERNMENT ORGANISATION MANAGEMENT
              </Text>
            </View>

            <Text style={styles.systemStatus}>
              SECURE GOVERNMENT SYSTEM
            </Text>
          </View>
        </View>

        {/* NAVIGATION */}
        <View style={styles.navigation}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navigationInner}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.navItem,
                activeNav === 'dashboard' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                navigate('/dsac/dashboard', 'dashboard')
              }
            >
              <Text
                style={[
                  styles.navText,
                  activeNav === 'dashboard' &&
                    styles.navTextActive,
                ]}
              >
                DASHBOARD
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.navItem,
                activeNav === 'organisations' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                setActiveNav('organisations')
              }
            >
              <Text
                style={[
                  styles.navText,
                  activeNav === 'organisations' &&
                    styles.navTextActive,
                ]}
              >
                ORGANISATIONS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.navItem,
                activeNav === 'funding' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                navigate(
                  '/dsac/funding-agreements',
                  'funding'
                )
              }
            >
              <Text
                style={[
                  styles.navText,
                  activeNav === 'funding' &&
                    styles.navTextActive,
                ]}
              >
                FUNDING
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.navItem,
                activeNav === 'cases' &&
                  styles.navItemActive,
              ]}
              onPress={() =>
                navigate('/dsac/cases', 'cases')
              }
            >
              <Text
                style={[
                  styles.navText,
                  activeNav === 'cases' &&
                    styles.navTextActive,
                ]}
              >
                ACCOUNTABILITY
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* MAIN CONTENT */}
        <View
          style={[
            styles.mainContent,
            isDesktop && styles.mainContentDesktop,
          ]}
        >
          {/* BREADCRUMB */}
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>
              HOME
            </Text>

            <Text style={styles.breadcrumbSeparator}>
              /
            </Text>

            <Text style={styles.breadcrumbText}>
              ORGANISATIONS
            </Text>
          </View>

          {/* PAGE HEADER */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <View style={styles.orangeAccent} />

              <View>
                <Text style={styles.pageTitle}>
                  ORGANISATIONS
                </Text>

                <Text style={styles.pageSubtitle}>
                  Register and manage participating
                  organisations
                </Text>
              </View>
            </View>

            {/* IMPORTANT: CLICKABLE REGISTER BUTTON */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  console.log(
                    'REGISTER ORGANISATION BUTTON PRESSED'
                  );

                  setShowCreateForm((current) => !current);
                }}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>
                  {showCreateForm
                    ? '× CLOSE FORM'
                    : '+ REGISTER ORGANISATION'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CREATE ORGANISATION FORM */}
          {showCreateForm && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    REGISTER ORGANISATION
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Create a new participating
                    organisation and its first administrator
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeCreateForm}
                  style={styles.closeFormButton}
                >
                  <Text style={styles.closeFormButtonText}>
                    CLOSE
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formDivider} />

              {/* ORGANISATION DETAILS */}
              <Text style={styles.formGroupTitle}>
                ORGANISATION DETAILS
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isDesktop && styles.formGridDesktop,
                ]}
              >
                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Organisation Name *
                  </Text>

                  <TextInput
                    value={form.organisationName}
                    onChangeText={(value) =>
                      updateField(
                        'organisationName',
                        value
                      )
                    }
                    placeholder="Enter organisation name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!creating}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Registration Number *
                  </Text>

                  <TextInput
                    value={form.registrationNumber}
                    onChangeText={(value) =>
                      updateField(
                        'registrationNumber',
                        value
                      )
                    }
                    placeholder="Enter registration number"
                    placeholderTextColor="#999"
                    style={styles.input}
                    autoCapitalize="characters"
                    editable={!creating}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Organisation Email *
                  </Text>

                  <TextInput
                    value={form.email}
                    onChangeText={(value) =>
                      updateField('email', value)
                    }
                    placeholder="organisation@example.org"
                    placeholderTextColor="#999"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!creating}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Organisation Type *
                  </Text>

                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        updateField(
                          'organisationType',
                          'NPO'
                        )
                      }
                      style={[
                        styles.typeOption,
                        form.organisationType ===
                          'NPO' &&
                          styles.typeOptionActive,
                      ]}
                      disabled={creating}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          form.organisationType ===
                            'NPO' &&
                            styles.typeOptionTextActive,
                        ]}
                      >
                        NPO
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        updateField(
                          'organisationType',
                          'PUBLIC_ENTITY'
                        )
                      }
                      style={[
                        styles.typeOption,
                        form.organisationType ===
                          'PUBLIC_ENTITY' &&
                          styles.typeOptionActive,
                      ]}
                      disabled={creating}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          form.organisationType ===
                            'PUBLIC_ENTITY' &&
                            styles.typeOptionTextActive,
                        ]}
                      >
                        PUBLIC ENTITY
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ADMINISTRATOR */}
              <Text style={styles.formGroupTitle}>
                FIRST ORGANISATION ADMINISTRATOR
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isDesktop && styles.formGridDesktop,
                ]}
              >
                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Full Name *
                  </Text>

                  <TextInput
                    value={form.adminFullName}
                    onChangeText={(value) =>
                      updateField(
                        'adminFullName',
                        value
                      )
                    }
                    placeholder="Administrator full name"
                    placeholderTextColor="#999"
                    style={styles.input}
                    editable={!creating}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Administrator Email *
                  </Text>

                  <TextInput
                    value={form.adminEmail}
                    onChangeText={(value) =>
                      updateField(
                        'adminEmail',
                        value
                      )
                    }
                    placeholder="admin@example.org"
                    placeholderTextColor="#999"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!creating}
                  />
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Password *
                  </Text>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={form.adminPassword}
                      onChangeText={(value) =>
                        updateField(
                          'adminPassword',
                          value
                        )
                      }
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="#999"
                      style={styles.passwordInput}
                      secureTextEntry={
                        !showAdminPassword
                      }
                      editable={!creating}
                    />

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setShowAdminPassword(
                          (current) => !current
                        )
                      }
                      style={styles.passwordButton}
                    >
                      <Text style={styles.passwordButtonText}>
                        {showAdminPassword
                          ? 'HIDE'
                          : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.field,
                    isDesktop && styles.fieldHalf,
                  ]}
                >
                  <Text style={styles.fieldLabel}>
                    Confirm Password *
                  </Text>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      value={form.confirmPassword}
                      onChangeText={(value) =>
                        updateField(
                          'confirmPassword',
                          value
                        )
                      }
                      placeholder="Re-enter password"
                      placeholderTextColor="#999"
                      style={styles.passwordInput}
                      secureTextEntry={
                        !showConfirmPassword
                      }
                      editable={!creating}
                    />

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      style={styles.passwordButton}
                    >
                      <Text style={styles.passwordButtonText}>
                        {showConfirmPassword
                          ? 'HIDE'
                          : 'SHOW'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* SECURITY NOTICE */}
              <View style={styles.securityNotice}>
                <View style={styles.securityIcon}>
                  <Text style={styles.securityIconText}>
                    !
                  </Text>
                </View>

                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityTitle}>
                    SECURITY NOTICE
                  </Text>

                  <Text style={styles.securityText}>
                    The first administrator will receive
                    access to manage the organisation.
                    Please ensure the administrator email
                    address is correct.
                  </Text>
                </View>
              </View>

              {/* FORM ACTIONS */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={resetForm}
                  disabled={creating}
                  style={[
                    styles.clearButton,
                    creating &&
                      styles.disabledButton,
                  ]}
                >
                  <Text style={styles.clearButtonText}>
                    CLEAR FORM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeCreateForm}
                  disabled={creating}
                  style={[
                    styles.cancelButton,
                    creating &&
                      styles.disabledButton,
                  ]}
                >
                  <Text style={styles.cancelButtonText}>
                    CANCEL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={createOrganisation}
                  disabled={creating}
                  style={[
                    styles.submitButton,
                    creating &&
                      styles.submitButtonDisabled,
                  ]}
                >
                  {creating ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={WHITE}
                      />

                      <Text
                        style={styles.submitButtonText}
                      >
                        REGISTERING...
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={styles.submitButtonText}
                    >
                      REGISTER ORGANISATION
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* REGISTERED ORGANISATIONS */}
          <View style={styles.organisationsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  REGISTERED ORGANISATIONS
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Organisations currently registered on
                  CIVITRACK
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {organisations.length}
                </Text>
              </View>
            </View>

            <View style={styles.formDivider} />

            {organisations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  NO ORGANISATIONS REGISTERED
                </Text>

                <Text style={styles.emptyText}>
                  There are currently no organisations
                  registered on the system.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log(
                      'EMPTY STATE REGISTER BUTTON PRESSED'
                    );

                    setShowCreateForm(true);
                  }}
                  style={styles.emptyRegisterButton}
                >
                  <Text
                    style={styles.emptyRegisterButtonText}
                  >
                    + REGISTER ORGANISATION
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.organisationsList}>
                {organisations.map((organisation) => (
                  <View
                    key={organisation.id}
                    style={styles.organisationCard}
                  >
                    <View
                      style={styles.organisationCardTop}
                    >
                      <View
                        style={
                          styles.organisationNameContainer
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
                            styles.registrationText
                          }
                        >
                          REGISTRATION:{' '}
                          {organisation.registration_number ||
                            'NOT PROVIDED'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          organisation.status ===
                            'ACTIVE'
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            organisation.status ===
                              'ACTIVE'
                              ? styles.statusTextActive
                              : styles.statusTextInactive,
                          ]}
                        >
                          {organisation.status ||
                            'UNKNOWN'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.organisationDetails}>
                      <View
                        style={
                          styles.detailColumn
                        }
                      >
                        <Text
                          style={styles.detailLabel}
                        >
                          TYPE
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          {organisation.organisation_type ||
                            '—'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailColumn
                        }
                      >
                        <Text
                          style={styles.detailLabel}
                        >
                          EMAIL
                        </Text>

                        <Text
                          style={styles.detailValue}
                          numberOfLines={1}
                        >
                          {organisation.email || '—'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailColumn
                        }
                      >
                        <Text
                          style={styles.detailLabel}
                        >
                          PHONE
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          {organisation.phone || '—'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailColumn
                        }
                      >
                        <Text
                          style={styles.detailLabel}
                        >
                          PROVINCE
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          {organisation.province || '—'}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.detailColumn
                        }
                      >
                        <Text
                          style={styles.detailLabel}
                        >
                          REGISTERED
                        </Text>

                        <Text
                          style={styles.detailValue}
                        >
                          {organisation.created_at
                            ? new Date(
                                organisation.created_at
                              ).toLocaleDateString(
                                'en-ZA'
                              )
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <Text style={styles.footerTitle}>
              CIVITRACK
            </Text>

            <Text style={styles.footerText}>
              Government Organisation Management System
            </Text>

            <Text style={styles.footerText}>
              Department of Sport, Arts and Culture
            </Text>

            <Text style={styles.footerCopyright}>
              © {new Date().getFullYear()} Government of
              South Africa
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  screen: {
    flex: 1,
    backgroundColor: LIGHT,
  },

  contentContainer: {
    flexGrow: 1,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 14,
    color: MUTED,
    fontSize: 14,
  },

  accessTitle: {
    color: DARK,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },

  accessText: {
    color: MUTED,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 22,
  },

  backButton: {
    marginTop: 25,
    backgroundColor: ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 5,
  },

  backButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },

  flagStrip: {
    height: 7,
    width: '100%',
    flexDirection: 'row',
  },

  flagRed: {
    flex: 1,
    backgroundColor: '#DE3831',
  },

  flagBlue: {
    flex: 1,
    backgroundColor: '#002395',
  },

  flagGreen: {
    flex: 1,
    backgroundColor: '#007A4D',
  },

  flagYellow: {
    flex: 1,
    backgroundColor: '#FFB81C',
  },

  govHeader: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  govHeaderInner: {
    minHeight: 115,
    width: '100%',
    maxWidth: 1450,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  saLogo: {
    width: 75,
    height: 75,
  },

  govTextContainer: {
    flex: 1,
  },

  govCountry: {
    color: DARK,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  govDepartment: {
    color: GREEN,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },

  govSubtext: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.4,
  },

  userHeader: {
    alignItems: 'flex-end',
    minWidth: 230,
  },

  signedInLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '800',
    letterSpacing: 1,
  },

  userRole: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },

  userEmail: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },

  dashboardButton: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: ORANGE,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
  },

  dashboardButtonText: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: '900',
  },

  systemBar: {
    backgroundColor: DARK,
    minHeight: 48,
  },

  systemBarInner: {
    width: '100%',
    maxWidth: 1450,
    alignSelf: 'center',
    minHeight: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  systemBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  systemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginRight: 8,
  },

  systemName: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  systemDescription: {
    color: '#BDBDBD',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 12,
  },

  systemStatus: {
    color: '#D9D9D9',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  navigation: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 10,
  },

  navigationInner: {
    paddingHorizontal: 24,
  },

  navItem: {
    paddingHorizontal: 17,
    paddingVertical: 14,
    marginRight: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  navItemActive: {
    borderBottomColor: ORANGE,
  },

  navText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  navTextActive: {
    color: DARK,
  },

  mainContent: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  mainContentDesktop: {
    maxWidth: 1450,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },

  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  breadcrumbText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
  },

  breadcrumbSeparator: {
    color: '#AAAAAA',
    marginHorizontal: 8,
    fontSize: 10,
  },

  pageHeader: {
    position: 'relative',
    zIndex: 1000,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 15,
  },

  pageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  orangeAccent: {
    width: 6,
    height: 48,
    backgroundColor: ORANGE,
    marginRight: 13,
  },

  pageTitle: {
    color: DARK,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  pageSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
  },

  actionRow: {
    position: 'relative',
    zIndex: 9999,
    elevation: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  registerButton: {
    position: 'relative',
    zIndex: 9999,
    elevation: 50,
    backgroundColor: ORANGE,
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  registerButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  formSection: {
    position: 'relative',
    zIndex: 5,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 4,
    borderTopColor: ORANGE,
    padding: 22,
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },

  sectionTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },

  closeFormButton: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 4,
  },

  closeFormButtonText: {
    color: DARK,
    fontSize: 10,
    fontWeight: '900',
  },

  formDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 20,
  },

  formGroupTitle: {
    color: DARK,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  formGrid: {
    width: '100%',
  },

  formGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  field: {
    marginBottom: 17,
    width: '100%',
  },

  fieldHalf: {
    width: '48.5%',
  },

  fieldLabel: {
    color: DARK,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },

  input: {
    width: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    borderRadius: 4,
    paddingHorizontal: 12,
    color: DARK,
    fontSize: 13,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },

  typeOption: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WHITE,
  },

  typeOptionActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  typeOptionText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
  },

  typeOptionTextActive: {
    color: WHITE,
  },

  passwordContainer: {
    width: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
  },

  passwordInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    color: DARK,
    fontSize: 13,
  },

  passwordButton: {
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },

  passwordButtonText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '900',
  },

  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F0D78A',
    padding: 14,
    borderRadius: 4,
    marginTop: 5,
  },

  securityIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  securityIconText: {
    color: WHITE,
    fontWeight: '900',
  },

  securityTextContainer: {
    flex: 1,
  },

  securityTitle: {
    color: DARK,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 3,
  },

  securityText: {
    color: '#665A36',
    fontSize: 11,
    lineHeight: 17,
  },

  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 9,
    marginTop: 22,
    flexWrap: 'wrap',
  },

  clearButton: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    minHeight: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },

  clearButtonText: {
    color: DARK,
    fontSize: 10,
    fontWeight: '900',
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    paddingHorizontal: 16,
    minHeight: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },

  cancelButtonText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '900',
  },

  submitButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    minHeight: 45,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  disabledButton: {
    opacity: 0.5,
  },

  organisationsSection: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  countBadgeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '900',
  },

  emptyState: {
    paddingVertical: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: DARK,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 500,
    lineHeight: 18,
  },

  emptyRegisterButton: {
    marginTop: 18,
    backgroundColor: ORANGE,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 4,
  },

  emptyRegisterButtonText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '900',
  },

  organisationsList: {
    width: '100%',
  },

  organisationCard: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    padding: 17,
    marginBottom: 12,
  },

  organisationCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 15,
  },

  organisationNameContainer: {
    flex: 1,
  },

  organisationName: {
    color: DARK,
    fontSize: 16,
    fontWeight: '900',
  },

  registrationText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },

  statusActive: {
    backgroundColor: '#E8F5EF',
  },

  statusInactive: {
    backgroundColor: '#FDECEC',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },

  statusTextActive: {
    color: GREEN,
  },

  statusTextInactive: {
    color: RED,
  },

  organisationDetails: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    marginTop: 16,
    paddingTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  detailColumn: {
    width: '50%',
    marginBottom: 12,
    paddingRight: 10,
  },

  detailLabel: {
    color: MUTED,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  detailValue: {
    color: DARK,
    fontSize: 11,
    fontWeight: '600',
  },

  footer: {
    backgroundColor: DARK,
    marginTop: 30,
  },

  footerInner: {
    width: '100%',
    maxWidth: 1450,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingVertical: 30,
  },

  footerTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerText: {
    color: '#BDBDBD',
    fontSize: 11,
    marginTop: 5,
  },

  footerCopyright: {
    color: '#888888',
    fontSize: 10,
    marginTop: 18,
  },
});