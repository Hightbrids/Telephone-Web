import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './_auth/AuthContext';

const C = { bg:'#FFF8FB', text:'#5B2A3D', border:'#F7D6E0', primary:'#FF8FB1' };

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!id || !password) return Alert.alert('กรอกข้อมูลให้ครบ');
    try {
      setLoading(true);
      await login({ id, password });
      router.replace('/product');
    } catch (e:any) {
      Alert.alert('ผิดพลาด', e.message || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <Text style={s.title}>เข้าสู่ระบบ</Text>
        <TextInput
          placeholder="ชื่อผู้ใช้หรืออีเมล"
          style={s.input}
          onChangeText={setId}
          value={id}
          placeholderTextColor="#9C6C7A"
        />
        <TextInput
          placeholder="รหัสผ่าน"
          style={s.input}
          secureTextEntry
          onChangeText={setPass}
          value={password}
          placeholderTextColor="#9C6C7A"
        />
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={s.link}>ยังไม่มีบัญชี? สมัครสมาชิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:{
    flex:1,
    backgroundColor:C.bg,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:20,
  },
  card:{
    width:'100%',
    maxWidth:420, // ✅ กำหนดความกว้างสูงสุด
    backgroundColor:'#fff',
    borderRadius:20,
    padding:24,
    borderWidth:1,
    borderColor:C.border,
    shadowColor:'#F7D6E0',
    shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.5,
    shadowRadius:10,
    elevation:4,
  },
  title:{
    fontSize:22,
    fontWeight:'900',
    color:C.text,
    marginBottom:20,
    textAlign:'center',
  },
  input:{
    backgroundColor:'#FFF0F6',
    borderColor:C.border,
    borderWidth:1,
    borderRadius:14,
    paddingVertical:12,
    paddingHorizontal:14,
    marginBottom:12,
    color:C.text,
    fontSize:15,
  },
  btn:{
    backgroundColor:C.primary,
    paddingVertical:14,
    borderRadius:16,
    alignItems:'center',
    marginTop:8,
    shadowColor:'#F7D6E0',
    shadowOffset:{ width:0, height:6 },
    shadowOpacity:0.5,
    shadowRadius:10,
    elevation:3,
  },
  btnText:{ color:'#fff', fontWeight:'900', fontSize:16 },
  link:{
    color:C.text,
    marginTop:16,
    textDecorationLine:'underline',
    textAlign:'center',
    fontSize:14,
  }
});
