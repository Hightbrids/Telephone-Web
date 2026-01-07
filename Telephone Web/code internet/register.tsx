import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './_auth/AuthContext';

const C = { bg:'#FFF8FB', text:'#5B2A3D', border:'#F7D6E0', primary:'#FF8FB1' };

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!username || !email || !password) {
      return Alert.alert('กรอกข้อมูลให้ครบ');
    }
    try {
      setSubmitting(true);
      await register({ username, email, password });
      router.replace('/login'); // สมัครสำเร็จ → ไปหน้าเข้าสู่ระบบ
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <Text style={s.title}>สมัครสมาชิก</Text>

        <TextInput
          placeholder="ชื่อผู้ใช้"
          style={s.input}
          onChangeText={setUsername}
          value={username}
          placeholderTextColor="#9C6C7A"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="อีเมล"
          style={s.input}
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
          placeholderTextColor="#9C6C7A"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="รหัสผ่าน"
          style={s.input}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          placeholderTextColor="#9C6C7A"
        />

        <TouchableOpacity
          style={[s.btn, submitting && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={s.btnText}>{submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={s.link}>มีบัญชีแล้ว? ไปหน้าเข้าสู่ระบบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // ทำให้ฟอร์มอยู่กลางจอ และกำหนดความกว้างสูงสุด
  wrap: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,             // ✅ ขนาดการ์ดพอดีตา (เหมือนหน้า Login)
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: C.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF0F6',
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    color: C.text,
    fontSize: 15,
  },
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  link: {
    color: C.text,
    marginTop: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontSize: 14,
  },
});
