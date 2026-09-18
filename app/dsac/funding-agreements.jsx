
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
        backgroundColor="#111111"
      />

      <ScrollView>
        <View style={styles.flagStrip}>
          <View style={styles.black} />
          <View style={styles.gold} />
          <View style={styles.green} />
          <View style={styles.blue} />
          <View style={styles.red} />
        </View>

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
            <Text style={styles.brand}>
              CIVITRACK
            </Text>

            <Text style={styles.subtitle}>
              DSAC Funding Management
            </Text>
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.heading}>
            <View style={styles.headingContent}>
              <Text style={styles.title}>
                Funding Agreements
              </Text>

              <Text style={styles.description}>
                Record and manage funding allocations and
                accountability requirements.
              </Text>
            </View>

            <Pressable
              style={styles.createButton}
              onPress={() => setShowForm(!showForm)}
            >
              <Text style={styles.createButtonText}>
                + CREATE AGREEMENT
              </Text>
            </Pressable>
          </View>

          {showForm && (
            <View style={styles.form}>
              <View style={styles.formTop} />

              <Text style={styles.formTitle}>
                Create Funding Agreement
              </Text>

              <Text style={styles.formDescription}>
                Each agreement will later be linked to an
                organisation and accountability case.
              </Text>

              <Text style={styles.label}>
                AGREEMENT NUMBER *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. DSAC-FA-2026-001"
                placeholderTextColor="#888888"
                value={agreementNumber}
                onChangeText={setAgreementNumber}
              />

              <Text style={styles.label}>
                ORGANISATION *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Select organisation"
                placeholderTextColor="#888888"
                value={organisation}
                onChangeText={setOrganisation}
              />

              <Text style={styles.label}>
                FUNDING AMOUNT *
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. R 500 000"
                placeholderTextColor="#888888"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>
                    START DATE *
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#888888"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>

                <View style={styles.dateField}>
                  <Text style={styles.label}>
                    END DATE *
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#888888"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.cancel}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.cancelText}>
                    CANCEL
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.save}
                  onPress={saveAgreement}
                >
                  <Text style={styles.saveText}>
                    SAVE AGREEMENT
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>
                ACTIVE AGREEMENTS
              </Text>

              <Text style={styles.summaryNumber}>
                0
              </Text>
            </View>

            <View>
              <Text style={styles.summaryLabel}>
                TOTAL ALLOCATION
              </Text>

              <Text style={styles.summaryNumber}>
                R 0
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            FUNDING AGREEMENTS
          </Text>

          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No funding agreements
            </Text>

            <Text style={styles.emptyText}>
              Create a funding agreement after registering
              the relevant organisation.
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  back: {
    color: '#FFB81C',
    fontSize: 12,
    fontWeight: '800',
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'right',
  },

  subtitle: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 3,
  },

  main: {
    width: '100%',
    maxWidth: 1200,
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
    fontSize: 13,
    marginTop: 7,
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
  },

  form: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 25,
    marginBottom: 25,
    overflow: 'hidden',
  },

  formTop: {
    height: 5,
    backgroundColor: '#FFB81C',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
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
    marginBottom: 15,
  },

  label: {
    color: '#333333',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 13,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 13,
    color: '#222222',
    fontSize: 14,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 15,
  },

  dateField: {
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 25,
  },

  cancel: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  cancelText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
  },

  save: {
    backgroundColor: '#007A4D',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  summary: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },

  summaryLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
  },

  summaryNumber: {
    color: '#111111',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 5,
  },

  sectionTitle: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 45,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '900',
  },

  emptyText: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
  },
});

