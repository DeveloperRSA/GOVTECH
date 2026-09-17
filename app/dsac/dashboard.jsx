import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

export default function DSACDashboard() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>GOVTECH</Text>

          <Text style={styles.title}>
            DSAC Accountability
          </Text>

          <Text style={styles.subtitle}>
            Administration Dashboard
          </Text>
        </View>

        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>DA</Text>
        </View>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>
          Welcome, DSAC Administrator
        </Text>

        <Text style={styles.welcomeText}>
          Manage organisations, funding agreements,
          accountability cases and reviews from one workspace.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Overview
      </Text>

      <View style={styles.grid}>
        <DashboardCard
          title="Organisations"
          value="0"
          description="Registered organisations"
        />

        <DashboardCard
          title="Funding Agreements"
          value="0"
          description="Active agreements"
        />

        <DashboardCard
          title="Accountability Cases"
          value="0"
          description="Cases being tracked"
        />

        <DashboardCard
          title="Pending Reviews"
          value="0"
          description="Cases awaiting review"
        />
      </View>

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>
          Create Organisation
        </Text>

        <Text style={styles.actionDescription}>
          Register an NPO or Public Entity and provision its
          primary administrator.
        </Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>
          Create Funding Agreement
        </Text>

        <Text style={styles.actionDescription}>
          Record funding allocation, objectives, targets and
          reporting requirements.
        </Text>
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>
          Create Accountability Case
        </Text>

        <Text style={styles.actionDescription}>
          Assign an accountability case to an organisation
          and activate its workspace.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          MVP Status
        </Text>

        <Text style={styles.infoText}>
          The dashboard foundation is ready. Supabase
          authentication and the DSAC database will be
          connected next.
        </Text>
      </View>
    </ScrollView>
  );
}

function DashboardCard({
  title,
  value,
  description,
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statDescription}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  brand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3D91',
    letterSpacing: 1,
  },

  title: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '700',
    color: '#172033',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#667085',
  },

  userBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B3D91',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  welcomeCard: {
    backgroundColor: '#0B3D91',
    borderRadius: 16,
    padding: 22,
    marginBottom: 28,
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  welcomeText: {
    color: '#E8F0FE',
    marginTop: 8,
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 14,
  },

  grid: {
    gap: 12,
    marginBottom: 28,
  },

  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 18,
  },

  statTitle: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '600',
  },

  statValue: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '800',
    color: '#172033',
  },

  statDescription: {
    marginTop: 4,
    color: '#98A2B3',
    fontSize: 13,
  },

  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 18,
    marginBottom: 12,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3D91',
  },

  actionDescription: {
    marginTop: 6,
    color: '#667085',
    lineHeight: 20,
  },

  infoCard: {
    marginTop: 10,
    marginBottom: 40,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#E8F0FE',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3D91',
  },

  infoText: {
    marginTop: 6,
    color: '#344054',
    lineHeight: 20,
  },
});