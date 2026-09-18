import { useState } from 'react';

import {
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

import { router } from 'expo-router';

export default function FundingAgreementsScreen() {
  const [showForm, setShowForm] = useState(false);

  const [agreementNumber, setAgreementNumber] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const saveAgreement = () => {
    if (
      !agreementNumber ||
      !organisation ||
      !amount ||
      !startDate ||
      !endDate
    ) {
      Alert.alert(
        'Missing Information',
        'Please complete all funding agreement fields.'
      );
      return;
    }

    Alert.alert(
      'Funding Agreement',
      'The funding agreement has been captured for the MVP. Supabase persistence will be connected next.'
    );

    setAgreementNumber('');
    setOrganisation('');
    setAmount('');
    setStartDate('');
    setEndDate('');
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#18202A"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ================================================= */}
        {/* SOUTH AFRICAN COLOUR STRIP */}
        {/* ================================================= */}

        <View style={styles.flagStrip}>

          <View style={styles.flagBlack} />
          <View style={styles.flagGold} />
          <View style={styles.flagGreen} />
          <View style={styles.flagBlue} />
          <View style={styles.flagRed} />

        </View>


        {/* ================================================= */}
        {/* GOVERNMENT MASTHEAD */}
        {/* ================================================= */}

        <View style={styles.govHeader}>

          <View style={styles.govIdentity}>

            {/* Temporary RSA emblem */}
            <View style={styles.emblemContainer}>

              <View style={styles.emblem}>
                <Text style={styles.emblemText}>
                  RSA
                </Text>
              </View>

            </View>


            <View style={styles.govText}>

              <Text style={styles.republic}>
                REPUBLIC OF SOUTH AFRICA
              </Text>

              <Text style={styles.department}>
                DEPARTMENT OF SPORT, ARTS AND CULTURE
              </Text>

              <View style={styles.headerDivider} />

              <Text style={styles.nationalDepartment}>
                National Department
              </Text>

            </View>

          </View>

        </View>


        {/* ================================================= */}
        {/* CIVITRACK SYSTEM BAR */}
        {/* ================================================= */}

        <View style={styles.systemBar}>

          <View style={styles.systemIdentity}>

            <Text style={styles.systemName}>
              CIVITRACK
            </Text>

            <Text style={styles.systemDescription}>
              Public Funding & Accountability Management System
            </Text>

          </View>


          <View style={styles.systemStatus}>

            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              SECURE SYSTEM
            </Text>

          </View>

        </View>


        {/* ================================================= */}
        {/* PAGE CONTENT */}
        {/* ================================================= */}

        <View style={styles.main}>

          {/* Breadcrumb */}

          <View style={styles.breadcrumb}>

            <Pressable
              onPress={() =>
                router.replace('/dsac/dashboard')
              }
            >

              <Text style={styles.breadcrumbLink}>
                CIVITRACK
              </Text>

            </Pressable>

            <Text style={styles.breadcrumbDivider}>
              /
            </Text>

            <Text style={styles.breadcrumbLink}>
              DSAC
            </Text>

            <Text style={styles.breadcrumbDivider}>
              /
            </Text>

            <Text style={styles.breadcrumbCurrent}>
              Funding Agreements
            </Text>

          </View>


          {/* ================================================= */}
          {/* PAGE HEADING */}
          {/* ================================================= */}

          <View style={styles.heading}>

            <View style={styles.headingContent}>

              <View style={styles.sectionMarker} />

              <Text style={styles.eyebrow}>
                FUNDING ADMINISTRATION
              </Text>

              <Text style={styles.title}>
                Funding Agreements
              </Text>

              <Text style={styles.description}>
                Record and manage departmental funding
                allocations and associated accountability
                requirements.
              </Text>

            </View>


            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setShowForm(!showForm)}
            >

              <Text style={styles.createButtonPlus}>
                +
              </Text>

              <Text style={styles.createButtonText}>
                {showForm
                  ? 'CLOSE FORM'
                  : 'CREATE AGREEMENT'}
              </Text>

            </Pressable>

          </View>


          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          {showForm && (

            <View style={styles.form}>

              <View style={styles.formTop} />


              <View style={styles.formHeader}>

                <View>

                  <Text style={styles.formEyebrow}>
                    NEW RECORD
                  </Text>

                  <Text style={styles.formTitle}>
                    Create Funding Agreement
                  </Text>

                  <Text style={styles.formDescription}>
                    Capture the core details of a departmental
                    funding agreement.
                  </Text>

                </View>


                <View style={styles.formStatus}>
                  <View style={styles.formStatusDot} />

                  <Text style={styles.formStatusText}>
                    DRAFT
                  </Text>
                </View>

              </View>


              <View style={styles.formDivider} />


              {/* AGREEMENT NUMBER */}

              <View style={styles.field}>

                <Text style={styles.label}>
                  AGREEMENT NUMBER
                  <Text style={styles.required}>
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="e.g. DSAC-FA-2026-001"
                  placeholderTextColor="#8A9298"
                  value={agreementNumber}
                  onChangeText={setAgreementNumber}
                  autoCapitalize="characters"
                />

              </View>


              {/* ORGANISATION */}

              <View style={styles.field}>

                <Text style={styles.label}>
                  ORGANISATION
                  <Text style={styles.required}>
                    {' '}*
                  </Text>
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter or select organisation"
                  placeholderTextColor="#8A9298"
                  value={organisation}
                  onChangeText={setOrganisation}
                />

              </View>


              {/* AMOUNT */}

              <View style={styles.field}>

                <Text style={styles.label}>
                  FUNDING AMOUNT
                  <Text style={styles.required}>
                    {' '}*
                  </Text>
                </Text>

                <View style={styles.amountInputContainer}>

                  <Text style={styles.currencyPrefix}>
                    R
                  </Text>

                  <TextInput
                    style={styles.amountInput}
                    placeholder="500 000"
                    placeholderTextColor="#8A9298"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />

                </View>

              </View>


              {/* DATES */}

              <View style={styles.dateRow}>

                <View style={styles.dateField}>

                  <Text style={styles.label}>
                    START DATE
                    <Text style={styles.required}>
                      {' '}*
                    </Text>
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8A9298"
                    value={startDate}
                    onChangeText={setStartDate}
                  />

                </View>


                <View style={styles.dateField}>

                  <Text style={styles.label}>
                    END DATE
                    <Text style={styles.required}>
                      {' '}*
                    </Text>
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8A9298"
                    value={endDate}
                    onChangeText={setEndDate}
                  />

                </View>

              </View>


              {/* FORM ACTIONS */}

              <View style={styles.actions}>

                <Pressable
                  style={({ pressed }) => [
                    styles.cancel,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setShowForm(false)}
                >

                  <Text style={styles.cancelText}>
                    CANCEL
                  </Text>

                </Pressable>


                <Pressable
                  style={({ pressed }) => [
                    styles.save,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={saveAgreement}
                >

                  <Text style={styles.saveText}>
                    SAVE AGREEMENT
                  </Text>

                </Pressable>

              </View>

            </View>

          )}


          {/* ================================================= */}
          {/* SUMMARY */}
          {/* ================================================= */}

          <View style={styles.summaryGrid}>

            {/* Active Agreements */}

            <View style={styles.summaryCard}>

              <View style={styles.summaryCardHeader}>

                <View style={styles.summaryIconGreen}>
                  <Text style={styles.summaryIconText}>
                    FA
                  </Text>
                </View>

                <Text style={styles.summaryLabel}>
                  ACTIVE AGREEMENTS
                </Text>

              </View>

              <Text style={styles.summaryNumber}>
                0
              </Text>

              <Text style={styles.summaryDescription}>
                Currently active funding agreements
              </Text>

              <View style={styles.summaryBottomLineGreen} />

            </View>


            {/* Total Allocation */}

            <View style={styles.summaryCard}>

              <View style={styles.summaryCardHeader}>

                <View style={styles.summaryIconGold}>
                  <Text style={styles.summaryIconTextDark}>
                    R
                  </Text>
                </View>

                <Text style={styles.summaryLabel}>
                  TOTAL ALLOCATION
                </Text>

              </View>

              <Text style={styles.summaryNumber}>
                R 0
              </Text>

              <Text style={styles.summaryDescription}>
                Total funding allocated through agreements
              </Text>

              <View style={styles.summaryBottomLineGold} />

            </View>


            {/* Pending */}

            <View style={styles.summaryCard}>

              <View style={styles.summaryCardHeader}>

                <View style={styles.summaryIconBlue}>
                  <Text style={styles.summaryIconText}>
                    P
                  </Text>
                </View>

                <Text style={styles.summaryLabel}>
                  PENDING
                </Text>

              </View>

              <Text style={styles.summaryNumber}>
                0
              </Text>

              <Text style={styles.summaryDescription}>
                Agreements requiring further processing
              </Text>

              <View style={styles.summaryBottomLineBlue} />

            </View>

          </View>


          {/* ================================================= */}
          {/* AGREEMENT LIST */}
          {/* ================================================= */}

          <View style={styles.listHeader}>

            <View>

              <Text style={styles.listEyebrow}>
                RECORDS
              </Text>

              <Text style={styles.sectionTitle}>
                Funding Agreements
              </Text>

            </View>


            <View style={styles.recordCount}>

              <Text style={styles.recordCountText}>
                0 RECORDS
              </Text>

            </View>

          </View>


          {/* ================================================= */}
          {/* EMPTY STATE */}
          {/* ================================================= */}

          <View style={styles.empty}>

            <View style={styles.emptyIcon}>

              <Text style={styles.emptyIconText}>
                FA
              </Text>

            </View>

            <Text style={styles.emptyTitle}>
              No funding agreements
            </Text>

            <Text style={styles.emptyText}>
              No funding agreements have been captured
              in CIVITRACK yet.
            </Text>

            <Text style={styles.emptySubText}>
              Register the relevant organisation before
              creating a funding agreement.
            </Text>


            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setShowForm(true)}
            >

              <Text style={styles.emptyButtonText}>
                + CREATE FIRST AGREEMENT
              </Text>

            </Pressable>

          </View>


          {/* ================================================= */}
          {/* INFORMATION NOTICE */}
          {/* ================================================= */}

          <View style={styles.notice}>

            <View style={styles.noticeIcon}>
              <Text style={styles.noticeIconText}>
                i
              </Text>
            </View>


            <View style={styles.noticeContent}>

              <Text style={styles.noticeTitle}>
                FUNDING ADMINISTRATION
              </Text>

              <Text style={styles.noticeText}>
                Funding agreements will form the basis for
                linking departmental allocations to
                organisations, accountability cases and
                approval workflows.
              </Text>

            </View>

          </View>

        </View>


        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <View style={styles.footer}>

          <Text style={styles.footerRepublic}>
            REPUBLIC OF SOUTH AFRICA
          </Text>

          <Text style={styles.footerDepartment}>
            Department of Sport, Arts and Culture
          </Text>

          <Text style={styles.footerSystem}>
            CIVITRACK — Public Funding & Accountability
            Management System
          </Text>

          <View style={styles.footerLine} />

          <Text style={styles.footerCopyright}>
            © 2026 Department of Sport, Arts and Culture
          </Text>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}


/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F5',
  },

  scrollContent: {
    flexGrow: 1,
  },


  /* ================================================= */
  /* FLAG STRIP */
  /* ================================================= */

  flagStrip: {
    height: 6,
    flexDirection: 'row',
  },

  flagBlack: {
    flex: 1,
    backgroundColor: '#000000',
  },

  flagGold: {
    flex: 1,
    backgroundColor: '#FFB612',
  },

  flagGreen: {
    flex: 2,
    backgroundColor: '#007A4D',
  },

  flagBlue: {
    flex: 1,
    backgroundColor: '#001489',
  },

  flagRed: {
    flex: 1,
    backgroundColor: '#DE3831',
  },


  /* ================================================= */
  /* GOVERNMENT HEADER */
  /* ================================================= */

  govHeader: {
    backgroundColor: '#18202A',
    paddingHorizontal: 32,
    paddingVertical: 18,
    minHeight: 105,
    justifyContent: 'center',
  },

  govIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emblemContainer: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 17,
  },

  emblem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4A72C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emblemText: {
    color: '#18202A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  govText: {
    flex: 1,
  },

  republic: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  department: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 5,
  },

  headerDivider: {
    width: 80,
    height: 2,
    backgroundColor: '#D4A72C',
    marginTop: 8,
    marginBottom: 5,
  },

  nationalDepartment: {
    color: '#AEB7BE',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
  },


  /* ================================================= */
  /* SYSTEM BAR */
  /* ================================================= */

  systemBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D7DCDF',
  },

  systemIdentity: {
    flex: 1,
  },

  systemName: {
    color: '#18202A',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 2,
  },

  systemDescription: {
    color: '#707A82',
    fontSize: 9,
    marginTop: 3,
  },

  systemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E5DE',
    backgroundColor: '#F6FAF8',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#007A4D',
    marginRight: 7,
  },

  statusText: {
    color: '#007A4D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },


  /* ================================================= */
  /* MAIN */
  /* ================================================= */

  main: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 30,
  },


  /* ================================================= */
  /* BREADCRUMB */
  /* ================================================= */

  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  breadcrumbLink: {
    color: '#007A4D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  breadcrumbDivider: {
    color: '#AAB2B8',
    marginHorizontal: 8,
    fontSize: 11,
  },

  breadcrumbCurrent: {
    color: '#6E7880',
    fontSize: 8,
    fontWeight: '700',
  },


  /* ================================================= */
  /* HEADING */
  /* ================================================= */

  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 27,
  },

  headingContent: {
    flex: 1,
    paddingRight: 20,
  },

  sectionMarker: {
    width: 45,
    height: 4,
    backgroundColor: '#007A4D',
    marginBottom: 10,
  },

  eyebrow: {
    color: '#007A4D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  title: {
    color: '#18202A',
    fontSize: 30,
    fontWeight: '900',
  },

  description: {
    color: '#69747D',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 650,
  },

  createButton: {
    backgroundColor: '#007A4D',
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  createButtonPlus: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '400',
    marginRight: 7,
    marginTop: -2,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  buttonPressed: {
    opacity: 0.75,
  },


  /* ================================================= */
  /* FORM */
  /* ================================================= */

  form: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6DBDE',
    padding: 28,
    marginBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },

  formTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 5,
    backgroundColor: '#D4A72C',
  },

  formHeader: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  formEyebrow: {
    color: '#007A4D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },

  formTitle: {
    color: '#18202A',
    fontSize: 21,
    fontWeight: '900',
  },

  formDescription: {
    color: '#707A82',
    fontSize: 10,
    marginTop: 5,
  },

  formStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E3E5',
    backgroundColor: '#F7F8F8',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  formStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4A72C',
    marginRight: 6,
  },

  formStatusText: {
    color: '#68737B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  formDivider: {
    height: 1,
    backgroundColor: '#E2E5E7',
    marginVertical: 21,
  },

  field: {
    marginBottom: 4,
  },

  label: {
    color: '#3B454D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: 12,
    marginBottom: 7,
  },

  required: {
    color: '#B3482C',
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#C8CED2',
    backgroundColor: '#FAFBFB',
    paddingHorizontal: 14,
    color: '#1E272F',
    fontSize: 13,
  },

  amountInputContainer: {
    height: 49,
    borderWidth: 1,
    borderColor: '#C8CED2',
    backgroundColor: '#FAFBFB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  currencyPrefix: {
    color: '#007A4D',
    fontSize: 15,
    fontWeight: '900',
    paddingLeft: 14,
    paddingRight: 5,
  },

  amountInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 7,
    color: '#1E272F',
    fontSize: 13,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 18,
  },

  dateField: {
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E5E7',
  },

  cancel: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#C8CED2',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#4D565D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  save: {
    minHeight: 45,
    backgroundColor: '#007A4D',
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  /* ================================================= */
  /* SUMMARY */
  /* ================================================= */

  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 32,
  },

  summaryCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DDDF',
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },

  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIconGreen: {
    width: 30,
    height: 30,
    backgroundColor: '#E8F3EE',
    borderWidth: 1,
    borderColor: '#CFE5DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  summaryIconGold: {
    width: 30,
    height: 30,
    backgroundColor: '#FFF6DE',
    borderWidth: 1,
    borderColor: '#F0DFAD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  summaryIconBlue: {
    width: 30,
    height: 30,
    backgroundColor: '#EAF0F8',
    borderWidth: 1,
    borderColor: '#D1DCEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  summaryIconText: {
    color: '#007A4D',
    fontSize: 9,
    fontWeight: '900',
  },

  summaryIconTextDark: {
    color: '#A07800',
    fontSize: 13,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#68737B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  summaryNumber: {
    color: '#18202A',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 17,
  },

  summaryDescription: {
    color: '#7B858C',
    fontSize: 9,
    marginTop: 4,
  },

  summaryBottomLineGreen: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: '#007A4D',
  },

  summaryBottomLineGold: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: '#D4A72C',
  },

  summaryBottomLineBlue: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: '#315A91',
  },


  /* ================================================= */
  /* LIST HEADER */
  /* ================================================= */

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 13,
  },

  listEyebrow: {
    color: '#007A4D',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },

  sectionTitle: {
    color: '#27313A',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  recordCount: {
    borderWidth: 1,
    borderColor: '#D5DADD',
    backgroundColor: '#F7F8F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  recordCountText: {
    color: '#78838B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  /* ================================================= */
  /* EMPTY STATE */
  /* ================================================= */

  empty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DDDF',
    paddingVertical: 50,
    paddingHorizontal: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    backgroundColor: '#F0F4F2',
    borderWidth: 1,
    borderColor: '#D7E4DE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyIconText: {
    color: '#007A4D',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  emptyTitle: {
    color: '#27313A',
    fontSize: 17,
    fontWeight: '900',
  },

  emptyText: {
    color: '#69747D',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },

  emptySubText: {
    color: '#8A9399',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },

  emptyButton: {
    backgroundColor: '#007A4D',
    paddingHorizontal: 17,
    paddingVertical: 12,
    marginTop: 18,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  /* ================================================= */
  /* INFORMATION NOTICE */
  /* ================================================= */

  notice: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DDDF',
    borderLeftWidth: 4,
    borderLeftColor: '#D4A72C',
    padding: 16,
    marginTop: 18,
    flexDirection: 'row',
  },

  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#18202A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noticeIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  noticeContent: {
    flex: 1,
    marginLeft: 11,
  },

  noticeTitle: {
    color: '#27313A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  noticeText: {
    color: '#69747D',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 5,
  },


  /* ================================================= */
  /* FOOTER */
  /* ================================================= */

  footer: {
    backgroundColor: '#18202A',
    borderTopWidth: 4,
    borderTopColor: '#007A4D',
    paddingVertical: 27,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },

  footerRepublic: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  footerDepartment: {
    color: '#D4A72C',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  footerSystem: {
    color: '#AAB2B9',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
  },

  footerLine: {
    width: 80,
    height: 1,
    backgroundColor: '#53606B',
    marginVertical: 13,
  },

  footerCopyright: {
    color: '#7F8992',
    fontSize: 8,
  },

});