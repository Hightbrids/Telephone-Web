import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './_auth/AuthContext';

const COLORS = {
  bg: '#FFF8FB',        // blush pink
  card: '#FFFFFF',      // white card
  primary: '#FF8FB1',   // pastel pink
  accent: '#FFD166',    // pastel yellow
  text: '#5B2A3D',      // plum text
  textMuted: '#9C6C7A', // muted rose
  border: '#F7D6E0',    // soft pink border
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Flora Bliss</Text>
      <Text style={styles.title}>FLOWER SHOP</Text>
      <Text style={styles.subtitle}>Bouquets & Gifts with Love</Text>

      {/* ถ้าล็อกอินแล้ว โชว์ชื่อผู้ใช้ */}
      {!loading && user && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            สวัสดี, {user.username} {user.role === 'admin' ? '(admin)' : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, styles.btnAccent]} onPress={() => router.push('/product')}>
        <Text style={styles.btnTextDark}>เลือกดอกไม้</Text>
      </TouchableOpacity>

      {/* ปุ่มเฉพาะ admin */}
      {!loading && user?.role === 'admin' && (
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push('/addproduct')}>
          <Text style={styles.btnTextLight}>เพิ่มสินค้า</Text>
        </TouchableOpacity>
      )}

      {/* ถ้ายังไม่ล็อกอิน แสดงปุ่มเข้าสู่ระบบ/สมัครสมาชิก */}
      {!loading && !user && (
        <View style={{ gap: 10, width: '100%', marginTop: 10 }}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push('/login')}>
            <Text style={styles.btnTextLight}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => router.push('/register')}>
            <Text style={styles.btnTextDark}>สมัครสมาชิก</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ถ้าล็อกอินแล้ว แสดงปุ่มออกจากระบบ */}
      {!loading && user && (
        <TouchableOpacity style={[styles.btn, styles.btnOutline, { marginTop: 10 }]} onPress={logout}>
          <Text style={styles.btnTextDark}>ออกจากระบบ</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: COLORS.bg },
  brand: { color: COLORS.primary, fontSize: 16, letterSpacing: 2, marginBottom: 8, fontWeight: '800' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: 10, marginBottom: 22, textAlign: 'center', lineHeight: 22 },

  badge: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  badgeText: { color: COLORS.text, fontWeight: '700' },

  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnAccent: { backgroundColor: COLORS.accent },
  btnOutline: { backgroundColor: COLORS.card },

  btnTextLight: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
  btnTextDark: { color: COLORS.text, fontWeight: '900', letterSpacing: 0.5 },
});
