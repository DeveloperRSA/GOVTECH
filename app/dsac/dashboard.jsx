import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import ProtectedRoute from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';
import { ROLES } from '../../src/constants/roles';

export default function DSACDashboard() {
  const {
    profile,
    signOut,
  } = useAuth();

  const [stats, setStats] = useState({
    organisations: 0,
    fundingAgreements: 0,
    accountabilityCases: 0,
    pendingReviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [
        organisationsResult,
        fundingResult,
        casesResult,
        reviewsResult,
      ] = await Promise.all([
        supabase
          .from('organisations')
          .select('id', {
            count: 'exact',
            head: true,
          }),

        supabase
          .from('funding_agreements')
          .select('id', {
            count: 'exact',
            head: true,
          }),

        supabase
          .from('accountability_cases')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .in('status', [
            'ASSIGNED',
            'IN PROGRESS',
            'SUBMITTED',
            'UNDER REVIEW',
            'ACTION REQUIRED',
            'RESUBMITTED',
          ]),

        supabase
          .from('approvals')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('status', 'PENDING'),
      ]);

      if (organisationsResult.error) {
        throw organisationsResult.error;
      }

      if (fundingResult.error) {
        throw fundingResult.error;
      }

      if (casesResult.error) {
        throw casesResult.error;
      }

      if (reviewsResult.error) {
        throw reviewsResult.error;
      }

      setStats({
        organisations:
          organisationsResult.count ?? 0,

        fundingAgreements:
          fundingResult.count ?? 0,

        accountabilityCases:
          casesResult.count ?? 0,

        pendingReviews:
          reviewsResult.count ?? 0,
      });
    } catch (error) {
      console.error(
        'DSAC dashboard loading error:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error(
        'Sign out error:',
        error
      );
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={[ROLES.DSAC_ADMIN]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#111111"
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
            />
          }
        >

          {/* Government colour strip */}

          <View style={styles.flagStrip}>
            <View style={styles.blackStrip} />
            <View style={styles.goldStrip} />
            <View style={styles.greenStrip} />
            <View style={styles.blueStrip} />
            <View style={styles.redStrip} />
          </View>


          {/* Header */}

          <View style={styles.header}>

            <View style={styles.identity}>

              <View style={styles.emblem}>
                <Text style={styles.emblemText}>
                  SA
                </Text>
              </View>

              <View>

                <Text style={styles.republic}>
                  REPUBLIC OF SOUTH AFRICA
                </Text>

                <Text style={styles.department}>
                  Department of Sport, Arts and Culture
                </Text>

              </View>

            </View>


            <View style={styles.account}>

              <Text style={styles.role}>
                DSAC ADMINISTRATOR
              </Text>

              <Text style={styles.email}>
                {profile?.email ||
                  'Administrator'}
              </Text>

              <Pressable
                onPress={logout}
              >
                <Text style={styles.signOut}>
                  Sign out
                </Text>
              </Pressable>

            </View>

          </View>


          {/* Brand */}

          <View style={styles.brandBar}>

            <View>

              <Text style={styles.brandName}>
                CIVITRACK
              </Text>

              <Text style={styles.brandSubtitle}>
                Public Funding & Accountability Platform
              </Text>

            </View>


            <View style={styles.activeSystem}>

              <View style={styles.activeDot} />

              <Text style={styles.activeText}>
                SYSTEM ACTIVE
              </Text>

            </View>

          </View>


          {/* Navigation */}

          <View style={styles.navigation}>

            <View style={styles.activeNav}>
              <Text style={styles.activeNavText}>
                Dashboard
              </Text>
            </View>


            <Pressable
              style={styles.navItem}
              onPress={() =>
                router.push(
                  '/dsac/organisations'
                )
              }
            >
              <Text style={styles.navText}>
                Organisations
              </Text>
            </Pressable>


            <Pressable
              style={styles.navItem}
              onPress={() =>
                router.push(
                  '/dsac/funding-agreements'
                )
              }
            >
              <Text style={styles.navText}>
                Funding
              </Text>
            </Pressable>


            <Pressable
              style={styles.navItem}
              onPress={() =>
                router.push(
                  '/dsac/cases'
                )
              }
            >
              <Text style={styles.navText}>
                Cases
              </Text>
            </Pressable>


            <Pressable
              style={styles.navItem}
            >
              <Text style={styles.navText}>
                Reports
              </Text>
            </Pressable>


            <Pressable
              style={styles.navItem}
            >
              <Text style={styles.navText}>
                Audit Log
              </Text>
            </Pressable>

          </View>


          {/* Main */}

          <View style={styles.main}>

            {/* Page heading */}

            <View style={styles.pageHeading}>

              <View style={styles.headingText}>

                <Text style={styles.pageTitle}>
                  DSAC Accountability Workspace
                </Text>

                <Text style={styles.pageDescription}>
                  Monitor public funding, organisational
                  performance and accountability requirements.
                </Text>

              </View>


              <View style={styles.periodBox}>

                <Text style={styles.periodLabel}>
                  CURRENT PERIOD
                </Text>

                <Text style={styles.periodValue}>
                  2026 / 2027
                </Text>

              </View>

            </View>


            {/* Accountability Overview */}

            <Text style={styles.sectionTitle}>
              ACCOUNTABILITY OVERVIEW
            </Text>


            <View style={styles.stats}>

              {/* Organisations */}

              <View style={styles.statCard}>

                <View style={styles.greenTop} />

                <Text style={styles.statLabel}>
                  ORGANISATIONS
                </Text>

                <Text style={styles.statNumber}>
                  {loading
                    ? '...'
                    : stats.organisations}
                </Text>

                <Text style={styles.statDescription}>
                  Registered NPOs and Public Entities
                </Text>

              </View>


              {/* Funding */}

              <View style={styles.statCard}>

                <View style={styles.goldTop} />

                <Text style={styles.statLabel}>
                  FUNDING AGREEMENTS
                </Text>

                <Text style={styles.statNumber}>
                  {loading
                    ? '...'
                    : stats.fundingAgreements}
                </Text>

                <Text style={styles.statDescription}>
                  Active funding agreements
                </Text>

              </View>


              {/* Cases */}

              <View style={styles.statCard}>

                <View style={styles.blackTop} />

                <Text style={styles.statLabel}>
                  ACCOUNTABILITY CASES
                </Text>

                <Text style={styles.statNumber}>
                  {loading
                    ? '...'
                    : stats.accountabilityCases}
                </Text>

                <Text style={styles.statDescription}>
                  Active accountability cases
                </Text>

              </View>


              {/* Reviews */}

              <View style={styles.statCard}>

                <View style={styles.redTop} />

                <Text style={styles.statLabel}>
                  PENDING REVIEWS
                </Text>

                <Text style={styles.statNumber}>
                  {loading
                    ? '...'
                    : stats.pendingReviews}
                </Text>

                <Text style={styles.statDescription}>
                  Cases awaiting review
                </Text>

              </View>

            </View>


            {/* Quick Actions */}

            <Text style={styles.sectionTitle}>
              QUICK ACTIONS
            </Text>


            <View style={styles.actions}>

              <Pressable
                style={styles.actionCard}
                onPress={() =>
                  router.push(
                    '/dsac/organisations'
                  )
                }
              >

                <View style={styles.actionIconGreen}>
                  <Text style={styles.actionIconText}>
                    +
                  </Text>
                </View>

                <View style={styles.actionContent}>

                  <Text style={styles.actionTitle}>
                    Create Organisation
                  </Text>

                  <Text style={styles.actionDescription}>
                    Register an NPO or Public Entity and
                    provision its administrator.
                  </Text>

                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>

              </Pressable>


              <Pressable
                style={styles.actionCard}
                onPress={() =>
                  router.push(
                    '/dsac/funding-agreements'
                  )
                }
              >

                <View style={styles.actionIconGold}>
                  <Text style={styles.actionIconText}>
                    R
                  </Text>
                </View>

                <View style={styles.actionContent}>

                  <Text style={styles.actionTitle}>
                    Create Funding Agreement
                  </Text>

                  <Text style={styles.actionDescription}>
                    Record funding allocation, agreement period
                    and accountability requirements.
                  </Text>

                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>

              </Pressable>


              <Pressable
                style={styles.actionCard}
                onPress={() =>
                  router.push(
                    '/dsac/cases'
                  )
                }
              >

                <View style={styles.actionIconBlack}>
                  <Text style={styles.actionIconText}>
                    C
                  </Text>
                </View>

                <View style={styles.actionContent}>

                  <Text style={styles.actionTitle}>
                    Create Accountability Case
                  </Text>

                  <Text style={styles.actionDescription}>
                    Assign an accountability case and activate
                    an organisation workspace.
                  </Text>

                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>

              </Pressable>

            </View>


            {/* Workflow */}

            <Text style={styles.sectionTitle}>
              CIVITRACK WORKFLOW
            </Text>


            <View style={styles.workflow}>

              <WorkflowStep
                number="1"
                title="Organisation"
                description="Register and provision access"
              />

              <Text style={styles.workflowArrow}>
                →
              </Text>

              <WorkflowStep
                number="2"
                title="Funding"
                description="Create funding agreement"
              />

              <Text style={styles.workflowArrow}>
                →
              </Text>

              <WorkflowStep
                number="3"
                title="Case"
                description="Assign accountability case"
              />

              <Text style={styles.workflowArrow}>
                →
              </Text>

              <WorkflowStep
                number="4"
                title="Workspace"
                description="Manage evidence and targets"
              />

              <Text style={styles.workflowArrow}>
                →
              </Text>

              <WorkflowStep
                number="5"
                title="Review"
                description="Review and approve"
              />

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

            <Text style={styles.footerCopyright}>
              © 2026 Republic of South Africa
            </Text>

          </View>

        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}


function WorkflowStep({
  number,
  title,
  description,
}) {
  return (
    <View style={styles.workflowStep}>

      <View style={styles.workflowCircle}>

        <Text style={styles.workflowNumber}>
          {number}
        </Text>

      </View>

      <Text style={styles.workflowTitle}>
        {title}
      </Text>

      <Text style={styles.workflowDescription}>
        {description}
      </Text>

    </View>
  );
}


const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F3F3F0',
  },

  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F3F0',
  },

  loadingText: {
    marginTop: 12,
    color: '#555555',
  },

  container: {
    flex: 1,
  },

  content: {
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

  header: {
    backgroundColor: '#111111',
    paddingHorizontal: 30,
    paddingVertical: 15,
    minHeight: 85,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emblem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007A4D',
    borderWidth: 3,
    borderColor: '#FFB81C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  emblemText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  republic: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  department: {
    color: '#CCCCCC',
    fontSize: 13,
    marginTop: 4,
  },

  account: {
    alignItems: 'flex-end',
  },

  role: {
    color: '#FFB81C',
    fontSize: 9,
    fontWeight: '900',
  },

  email: {
    color: '#CCCCCC',
    fontSize: 10,
    marginTop: 4,
  },

  signOut: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 5,
    textDecorationLine: 'underline',
  },

  brandBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },

  brandName: {
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#111111',
  },

  brandSubtitle: {
    marginTop: 3,
    color: '#007A4D',
    fontSize: 12,
    fontWeight: '700',
  },

  activeSystem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF7F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007A4D',
    marginRight: 7,
  },

  activeText: {
    color: '#007A4D',
    fontSize: 9,
    fontWeight: '900',
  },

  navigation: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },

  activeNav: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 4,
    borderBottomColor: '#FFB81C',
  },

  activeNavText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
  },

  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  navText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },

  main: {
    width: '100%',
    maxWidth: 1300,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 35,
  },

  pageHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },

  headingText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#171717',
  },

  pageDescription: {
    marginTop: 7,
    color: '#666666',
    fontSize: 13,
    maxWidth: 750,
  },

  periodBox: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB81C',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  periodLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
  },

  periodValue: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },

  sectionTitle: {
    color: '#333333',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    minWidth: 200,
    minHeight: 140,
    margin: 6,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
  },

  greenTop: {
    height: 5,
    backgroundColor: '#007A4D',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  goldTop: {
    height: 5,
    backgroundColor: '#FFB81C',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  blackTop: {
    height: 5,
    backgroundColor: '#111111',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  redTop: {
    height: 5,
    backgroundColor: '#DE3831',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  statLabel: {
    marginTop: 5,
    color: '#666666',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  statNumber: {
    marginTop: 12,
    color: '#111111',
    fontSize: 34,
    fontWeight: '900',
  },

  statDescription: {
    marginTop: 4,
    color: '#777777',
    fontSize: 10,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 30,
  },

  actionCard: {
    flex: 1,
    minWidth: 280,
    margin: 6,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    flexDirection: 'row',
    alignItems: 'center',
  },

  actionIconGreen: {
    width: 44,
    height: 44,
    backgroundColor: '#007A4D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIconGold: {
    width: 44,
    height: 44,
    backgroundColor: '#FFB81C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIconBlack: {
    width: 44,
    height: 44,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  actionContent: {
    flex: 1,
    marginLeft: 13,
  },

  actionTitle: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '900',
  },

  actionDescription: {
    color: '#777777',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  arrow: {
    color: '#007A4D',
    fontSize: 26,
    marginLeft: 8,
  },

  workflow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  workflowStep: {
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
  },

  workflowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#007A4D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  workflowNumber: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  workflowTitle: {
    marginTop: 8,
    color: '#222222',
    fontSize: 12,
    fontWeight: '900',
  },

  workflowDescription: {
    marginTop: 4,
    color: '#777777',
    fontSize: 9,
    textAlign: 'center',
  },

  workflowArrow: {
    color: '#FFB81C',
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: 5,
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