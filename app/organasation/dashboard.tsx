import React, { useCallback, useState } from 'react';

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';

import ProtectedRoute from '../../src/components/ProtectedRoute';
import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import StatCard from '../../src/components/dashboard/StatCard';
import EmptyState from '../../src/components/EmptyState';

import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';
import { ROLES } from '../../src/constants/roles';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function OrganisationDashboard() {
  const { user, profile } = useAuth();
  const userId = (
    user as unknown as {
      id?: string;
    } | null | undefined
  )?.id;

  const [stats, setStats] = useState({
    cases: 0,
    tasks: 0,
    documents: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!userId) {
      setStats({
        cases: 0,
        tasks: 0,
        documents: 0,
      });

      return;
    }

    try {
      /*
       * The organisation is NOT stored directly on user_profiles.
       * It is obtained through organisation_memberships.
       */
      const {
        data: membership,
        error: membershipError,
      } = await supabase
        .from('organisation_memberships')
        .select('organisation_id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      const organisationId = membership?.organisation_id;

      if (!organisationId) {
        setStats({
          cases: 0,
          tasks: 0,
          documents: 0,
        });

        return;
      }

      /*
       * Load dashboard statistics.
       */
      const [
        casesResult,
        tasksResult,
        documentsResult,
      ] = await Promise.all([
        /*
         * Accountability cases
         */
        supabase
          .from('accountability_cases')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'organisation_id',
            organisationId
          ),

        /*
         * Open tasks
         *
         * COMPLETED and CANCELLED tasks
         * are excluded.
         */
        supabase
          .from('tasks')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'organisation_id',
            organisationId
          )
          .not(
            'status',
            'in',
            '("COMPLETED","CANCELLED")'
          ),

        /*
         * Documents
         */
        supabase
          .from('documents')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq(
            'organisation_id',
            organisationId
          ),
      ]);

      /*
       * Check for database errors.
       */
      if (casesResult.error) {
        throw casesResult.error;
      }

      if (tasksResult.error) {
        throw tasksResult.error;
      }

      if (documentsResult.error) {
        throw documentsResult.error;
      }

      /*
       * Update dashboard statistics.
       */
      setStats({
        cases: casesResult.count ?? 0,
        tasks: tasksResult.count ?? 0,
        documents: documentsResult.count ?? 0,
      });
    } catch (error) {
      console.error(
        'Organisation dashboard error:',
        error
      );
    }
  }, [userId]);

  /*
   * Reload dashboard whenever
   * the screen receives focus.
   */
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  /*
   * Pull-to-refresh.
   */
  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={[
        ROLES.ORG_ADMIN,
        ROLES.ORG_STAFF,
      ] as any}
    >
      <View style={styles.container}>

        <DashboardHeader
          title="Organisation Dashboard"
          subtitle="Accountability Workspace"
          userName={
            (profile as {
              full_name?: string;
            } | null | undefined)?.full_name || 'User'
          }
          onProfilePress={() => undefined}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
            />
          }
        >

          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <View style={styles.statsRow}>

            <StatCard
              title="Cases"
              value={stats.cases}
              subtitle="Assigned accountability cases"
              icon="📋"
            />

            <StatCard
              title="Open Tasks"
              value={stats.tasks}
              subtitle="Tasks requiring attention"
              icon="✓"
            />

            <StatCard
              title="Documents"
              value={stats.documents}
              subtitle="Uploaded documents"
              icon="📄"
            />

          </View>

          {stats.cases === 0 && (
            <View style={styles.section}>
              <EmptyState
                title="No accountability cases"
                message="Cases assigned to your organisation will appear here."
              />
            </View>
          )}

        </ScrollView>

      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },

  section: {
    marginTop: SPACING.xl,
  },
});