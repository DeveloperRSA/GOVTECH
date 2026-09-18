import React, {
  useCallback,
  useState,
} from "react";

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from 'expo-router';

import ProtectedRoute from "../../src/components/ProtectedRoute";
import DashboardHeader from "../../src/components/dashboard/DashboardHeader";
import StatCard from "../../src/components/dashboard/StatCard";
import EmptyState from "../../src/components/EmptyState";

import { useAuth } from "../../src/hooks/useAuth";
import { ROLES } from "../../src/constants/roles";
import { supabase } from "../../src/services/supabase";

import {
  COLORS,
  SPACING,
} from "../../src/constants/theme";

export default function DsacDashboard() {
  const { profile } = useAuth();

  const [stats, setStats] = useState({
    organisations: 0,
    activeCases: 0,
    pendingReviews: 0,
  });

  const [hasOrganisations, setHasOrganisations] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        organisationsResult,
        casesResult,
        reviewsResult,
      ] = await Promise.all([
        supabase
          .from("organisations")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("accountability_cases")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("status", [
            "open",
            "in_progress",
            "submitted",
          ]),

        supabase
          .from("approvals")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "pending"),
      ]);

      if (organisationsResult.error) {
        throw organisationsResult.error;
      }

      if (casesResult.error) {
        throw casesResult.error;
      }

      if (reviewsResult.error) {
        throw reviewsResult.error;
      }

      const organisationCount =
        organisationsResult.count ?? 0;

      const activeCaseCount =
        casesResult.count ?? 0;

      const pendingReviewCount =
        reviewsResult.count ?? 0;

      setStats({
        organisations: organisationCount,
        activeCases: activeCaseCount,
        pendingReviews: pendingReviewCount,
      });

      setHasOrganisations(
        organisationCount > 0
      );
    } catch (error) {
      console.error(
        "DSAC dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  return (
    <ProtectedRoute
      allowedRoles={[ROLES.DSAC_ADMIN]}
    >
      <View style={styles.container}>
        <DashboardHeader
          title="Dashboard"
          subtitle="Accountability Workspace"
          userName={profile?.full_name}
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
              title="Organisations"
              value={
                loading
                  ? "..."
                  : stats.organisations
              }
              subtitle="Registered organisations"
            />

            <StatCard
              title="Active Cases"
              value={
                loading
                  ? "..."
                  : stats.activeCases
              }
              subtitle="Current accountability cases"
            />

            <StatCard
              title="Pending Reviews"
              value={
                loading
                  ? "..."
                  : stats.pendingReviews
              }
              subtitle="Awaiting review"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Organisations
            </Text>

            {!loading && !hasOrganisations ? (
              <EmptyState
                title="No organisations yet"
                message="Organisations created by DSAC administrators will appear here."
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Accountability Cases
            </Text>

            {!loading &&
            stats.activeCases === 0 ? (
              <EmptyState
                title="No active cases"
                message="Active accountability cases will appear here once they are created."
              />
            ) : null}
          </View>
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
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  section: {
    marginTop: SPACING.xl,
  },
});