import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './_auth/AuthContext';

const COLORS = {
  bg: '#FFF8FB',
  card: '#FFFFFF',
  primary: '#FF8FB1',
  accent: '#FFD166',
  text: '#5B2A3D',
  textMuted: '#9C6C7A',
  border: '#F7D6E0',
};

export default function LogoutPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      // ถ้าไม่มี user อยู่แล้ว กลับหน้า login ทันที
      router.replace('/login');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout(); // เคลียร์ token และ user
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ออกจากระบบ</Text>
        <Text style={styles.subtitle}>คุณต้องการออกจากระบบหรือไม่?</Text>

        <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleLogout}>
            <Text style={styles.btnTextLight}>ออกจากระบบ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => router.back()}>
            <Text style={styles.btnTextDark}>ยกเลิก</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 20 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  subtitle: { color: COLORS.textMuted, textAlign: 'center' },

  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { backgroundColor: COLORS.card },
  btnTextLight: { color: '#fff', fontWeight: '900' },
  btnTextDark: { color: COLORS.text, fontWeight: '900' },
});
