import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import ProtectedRoute from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';
import { ROLES } from '../../src/constants/roles';
import { supabase } from '../../src/services/supabase';

const COLORS = {
  navy: '#003B5C',
  blue: '#0053A1',
  green: '#009366',
  orange: '#F7941D',
  red: '#F05D2A',
  white: '#FFFFFF',
  background: '#F4F7FA',
  border: '#D9E2EA',
  text: '#17324D',
  muted: '#66788A',
  lightBlue: '#EAF3FB',
  lightGreen: '#EAF7F2',
  lightOrange: '#FFF4E4',
  lightRed: '#FDEDEA',
};

const ACTIONABLE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFICATION',
  'DECISION',
  'RETURNED',
];

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusStyle(status) {
  if (status === 'SUBMITTED') {
    return {
      backgroundColor: COLORS.lightOrange,
      color: '#A85A00',
    };
  }

  if (status === 'RETURNED') {
    return {
      backgroundColor: COLORS.lightRed,
      color: COLORS.red,
    };
  }

  if (status === 'COMPLETED') {
    return {
      backgroundColor: COLORS.lightGreen,
      color: COLORS.green,
    };
  }

  return {
    backgroundColor: COLORS.lightBlue,
    color: COLORS.blue,
  };
}

export default function OrganisationReviews() {
  const { profile } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('No authenticated reviewer found.');
      }

      const {
        data: reviewRows,
        error: reviewError,
      } = await supabase
        .from('reviews')
        .select(`
          id,
          organisation_id,
          review_type,
          status,
          decision,
          reviewer_comments,
          verification_notes,
          submitted_at,
          reviewed_at,
          created_at
        `)
        .eq('reviewer_id', user.id)
        .eq('review_type', 'ORGANISATION')
        .in('status', ACTIONABLE_STATUSES)
        .order('created_at', {
          ascending: false,
        });

      if (reviewError) throw reviewError;

      const rows = reviewRows || [];

      const organisationIds = [
        ...new Set(
          rows.map(
            (item) => item.organisation_id
          ).filter(Boolean)
        ),
      ];

      let organisations = [];

      if (organisationIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('organisations')
          .select(`
            id,
            name,
            registration_number,
            province,
            status,
            email,
            phone,
            address
          `)
          .in('id', organisationIds);

        if (error) throw error;

        organisations = data || [];
      }

      const organisationMap = new Map(
        organisations.map((item) => [
          item.id,
          item,
        ])
      );

      setReviews(
        rows.map((review) => ({
          ...review,
          organisation:
            organisationMap.get(
              review.organisation_id
            ) || null,
        }))
      );
    } catch (error) {
      console.error(
        'Organisation reviews error:',
        error
      );

      Alert.alert(
        'Unable to load reviews',
        error?.message ||
          'Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const filteredReviews = reviews.filter(
    (review) => {
      const organisation =
        review.organisation;

      const searchable = [
        organisation?.name,
        organisation?.registration_number,
        organisation?.province,
        review.status,
        review.decision,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(
        search.toLowerCase()
      );
    }
  );

  const openReview = (review) => {
    router.push({
      pathname: '/reviewer/reviews/[id]',
      params: {
        id: review.id,
      },
    });
  };

  if (loading) {
    return (
      <ProtectedRoute
        allowedRoles={[ROLES.DSAC_REVIEWER]}
      >
        <SafeAreaView style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={COLORS.blue}
          />

          <Text style={styles.loadingText}>
            Loading organisation reviews...
          </Text>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      allowedRoles={[ROLES.DSAC_REVIEWER]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.navy}
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadReviews();
              }}
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.department}>
                DEPARTMENT OF SPORT, ARTS AND CULTURE
              </Text>

              <Text style={styles.title}>
                Organisation Reviews
              </Text>

              <Text style={styles.subtitle}>
                Reviewer Workspace
              </Text>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                Back
              </Text>
            </Pressable>
          </View>

          <View style={styles.intro}>
            <Text style={styles.introTitle}>
              Assigned Organisation Reviews
            </Text>

            <Text style={styles.introText}>
              These are organisation reviews currently
              assigned to you and requiring action.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryLabel}>
                REVIEWS REQUIRING ACTION
              </Text>

              <Text style={styles.summaryNumber}>
                {reviews.length}
              </Text>
            </View>

            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>
                DSAC REVIEWER
              </Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search organisation, registration or province..."
              placeholderTextColor={COLORS.muted}
              style={styles.searchInput}
            />
          </View>

          {filteredReviews.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✓</Text>

              <Text style={styles.emptyTitle}>
                No reviews found
              </Text>

              <Text style={styles.emptyText}>
                There are currently no organisation reviews
                matching your search.
              </Text>
            </View>
          ) : (
            filteredReviews.map((review) => {
              const organisation =
                review.organisation;

              const badge =
                statusStyle(review.status);

              return (
                <View
                  key={review.id}
                  style={styles.reviewCard}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.cardIconText}>
                        O
                      </Text>
                    </View>

                    <View style={styles.cardHeading}>
                      <Text style={styles.organisationName}>
                        {organisation?.name ||
                          'Organisation'}
                      </Text>

                      <Text style={styles.reference}>
                        Organisation Review
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.status,
                        {
                          backgroundColor:
                            badge.backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: badge.color,
                          },
                        ]}
                      >
                        {review.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.details}>
                    <View style={styles.detail}>
                      <Text style={styles.label}>
                        Registration Number
                      </Text>

                      <Text style={styles.value}>
                        {organisation?.registration_number ||
                          '—'}
                      </Text>
                    </View>

                    <View style={styles.detail}>
                      <Text style={styles.label}>
                        Province
                      </Text>

                      <Text style={styles.value}>
                        {organisation?.province ||
                          '—'}
                      </Text>
                    </View>

                    <View style={styles.detail}>
                      <Text style={styles.label}>
                        Submitted
                      </Text>

                      <Text style={styles.value}>
                        {formatDate(
                          review.submitted_at
                        )}
                      </Text>
                    </View>

                    <View style={styles.detail}>
                      <Text style={styles.label}>
                        Decision
                      </Text>

                      <Text style={styles.value}>
                        {review.decision ||
                          'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      onPress={() =>
                        openReview(review)
                      }
                      style={styles.reviewButton}
                    >
                      <Text
                        style={styles.reviewButtonText}
                      >
                        REVIEW SUBMISSION
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CIVITRACK • DSAC Reviewer Workspace
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  header: {
    backgroundColor: COLORS.navy,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  department: {
    color: '#C9D9E5',
    fontSize: 9,
    fontWeight: '800',
  },

  title: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 5,
  },

  subtitle: {
    color: '#D7E6F0',
    marginTop: 3,
    fontSize: 12,
  },

  backButton: {
    borderWidth: 1,
    borderColor: '#8EAFC3',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 7,
  },

  backText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },

  intro: {
    padding: 20,
    backgroundColor: COLORS.white,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },

  introText: {
    marginTop: 6,
    color: COLORS.muted,
    lineHeight: 20,
    fontSize: 13,
  },

  summaryCard: {
    margin: 16,
    padding: 18,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: '#C8DDED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '800',
  },

  summaryNumber: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.blue,
  },

  summaryBadge: {
    backgroundColor: COLORS.navy,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  summaryBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
  },

  searchBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
  },

  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 13,
  },

  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardIcon: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardIconText: {
    color: COLORS.blue,
    fontSize: 18,
    fontWeight: '900',
  },

  cardHeading: {
    flex: 1,
    marginLeft: 12,
  },

  organisationName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  reference: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },

  status: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },

  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  detail: {
    minWidth: 145,
    flex: 1,
  },

  label: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  value: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },

  actions: {
    marginTop: 16,
  },

  reviewButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 7,
    paddingVertical: 11,
    alignItems: 'center',
  },

  reviewButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },

  empty: {
    margin: 16,
    padding: 35,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  emptyIcon: {
    color: COLORS.green,
    fontSize: 25,
    fontWeight: '900',
  },

  emptyTitle: {
    marginTop: 10,
    fontWeight: '900',
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 5,
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    padding: 25,
    alignItems: 'center',
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 10,
  },
});