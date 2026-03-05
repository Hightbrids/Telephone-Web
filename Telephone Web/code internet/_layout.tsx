import { Feather } from '@expo/vector-icons';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthProvider, useAuth } from './_auth/AuthContext';

const COLORS = {
  bg: '#FFF8FB',        // blush pink
  card: '#FFFFFF',      // white card
  primary: '#FF8FB1',   // pastel pink
  accent: '#FFD166',    // pastel yellow
  text: '#5B2A3D',      // plum text
  textMuted: '#9C6C7A', // muted rose
  border: '#F7D6E0',    // soft pink border
};

const Header = () => {
  const segments = useSegments();
  let title = 'Flora Bliss';
  if (segments.length > 0 && segments[0]) {
    switch (segments[0]) {
      case 'product': title = 'Flowers'; break;
      case 'addproduct': title = 'Add Flower'; break;
      case 'edit': title = 'Edit Flower'; break;
      case 'login': title = 'Sign In'; break;
      case 'register': title = 'Sign Up'; break;
      case 'logout': title = 'Logout'; break;
    }
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Feather name="heart" size={22} color={COLORS.primary} />
        <Text style={styles.logoText}>Flora Bliss</Text>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 22 }} />
    </View>
  );
};

// ---------- Guard ทุกหน้า ยกเว้น publicRoutes ----------
function ProtectedSlot() {
  const router = useRouter();
  const segments = useSegments();
  const first = segments[0] ?? 'index';

  // หน้าที่อนุญาตให้เข้าถึงโดยไม่ต้องล็อกอิน
  const publicRoutes = new Set(['login', 'register', 'logout']);

  const { user, loading } = useAuth();

  useEffect(() => {
    if (publicRoutes.has(first)) return; // หน้า public - ไม่ต้องเช็ค
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, first]);

  // ระหว่างโหลด token
  if (!publicRoutes.has(first) && loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 8, color: COLORS.textMuted }}>กำลังตรวจสอบสิทธิ์...</Text>
      </View>
    );
  }

  return <Slot />;
}

const Footer = () => {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[0] || 'index';
  const { user } = useAuth();

  const items = [
    { label: 'Home', iconName: 'home', path: '/' },
    { label: 'Flowers', iconName: 'tag', path: '/product' },
    ...(user?.role === 'admin' ? [{ label: 'Add', iconName: 'plus', path: '/addproduct' as const }] : []),
  ];

  return (
    <View style={styles.footer}>
      {items.map((item, i) => {
        const active =
          (currentRoute === item.path.replace('/', '')) ||
          (item.path === '/' && currentRoute === 'index');
        return (
          <TouchableOpacity key={i} style={styles.footerItem} onPress={() => router.push(item.path)}>
            <Feather
              name={item.iconName as any}
              size={22}
              color={active ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.footerLabel, active && styles.footerLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />
      <AuthProvider>
        <View style={styles.slotContainer}>
          <ProtectedSlot />
        </View>
        <Footer />
      </AuthProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'web' ? 0 : StatusBar.currentHeight,
  },
  header: {
    height: 78,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerTitle: {
    position: 'absolute',
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
  },
  slotContainer: { flex: 1 },

  loadingWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg,
  },

  footer: {
    height: 74,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  footerItem: { alignItems: 'center' },
  footerLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  footerLabelActive: { color: COLORS.primary, fontWeight: '800' },
});
