import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './_auth/AuthContext';

const API_BASE_URL = 'http://nindam.sytes.net:3010/api/products';

const COLORS = {
  bg: '#FFF8FB',
  card: '#FFFFFF',
  primary: '#FF8FB1',
  accent: '#FFD166',
  text: '#5B2A3D',
  textMuted: '#9C6C7A',
  border: '#F7D6E0',
  input: '#FFF0F6',
};

type ProductForm = {
  Name: string;
  Description: string;
  Price: string;        // เก็บเป็น string ในฟอร์ม แต่จะ parse เป็น number ตอนส่ง
  Stock: string;        // ✅ เพิ่มช่องจำนวนคงเหลือ
  Category: string;
  Manufacturer: string;
  Rating: string;       // 0-5
};

export default function AddProductPage() {
  const { authFetch, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // guard เฉพาะ admin
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      Alert.alert('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบเท่านั้น');
      router.replace('/product');
    }
  }, [authLoading, user]);

  const [form, setForm] = useState<ProductForm>({
    Name: '',
    Description: '',
    Price: '',
    Stock: '',            // ✅ ค่าเริ่มต้น
    Category: '',
    Manufacturer: '',
    Rating: '0',
  });

  const [image, setImage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const onChange = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: Platform.OS === 'web' ? true : false,
    });
    if (!result.canceled) {
      if (Platform.OS === 'web') {
        setImage({
          uri: `data:image/jpeg;base64,${result.assets[0].base64}`,
          name: result.assets[0].fileName || 'photo.jpg',
          type: 'image/jpeg',
        });
      } else {
        setImage(result.assets[0]);
      }
    }
  };

  const handleSubmit = async () => {
    // validation ขั้นพื้นฐาน
    if (!form.Name?.trim() || !form.Description?.trim() || !form.Price?.trim()) {
      return Alert.alert('กรอกไม่ครบ', 'กรุณากรอก Name, Description และ Price');
    }
    const priceNum = parseFloat(form.Price);
    if (isNaN(priceNum) || priceNum < 0) {
      return Alert.alert('ราคาไม่ถูกต้อง', 'กรุณากรอกราคาเป็นตัวเลขมากกว่าหรือเท่ากับ 0');
    }

    // ✅ ตรวจสอบ Stock
    const stockNum = form.Stock === '' ? 0 : parseInt(form.Stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return Alert.alert('สต็อกไม่ถูกต้อง', 'กรุณากรอกจำนวนคงเหลือเป็นตัวเลขมากกว่าหรือเท่ากับ 0');
    }

    const ratingNum = Math.max(0, Math.min(5, Number(form.Rating) || 0)); // clamp 0-5

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('Name', form.Name.trim());
      formData.append('Description', form.Description.trim());
      formData.append('Price', String(priceNum));
      formData.append('Stock', String(stockNum));                 // ✅ ส่งขึ้น API
      formData.append('Category', form.Category.trim());
      formData.append('Manufacturer', form.Manufacturer.trim());
      formData.append('Rating', String(ratingNum));

      if (image?.uri) {
        if (image.uri.startsWith('data:')) {
          const blob = await (await fetch(image.uri)).blob();
          formData.append('Image', blob, image.name || 'photo.jpg');
        } else {
          const ext = (image.uri.split('.').pop() || 'jpg').split('?')[0];
          formData.append('Image', { uri: image.uri, name: `photo.${ext}`, type: image.type || 'image/jpeg' } as any);
        }
      }

      const res = await authFetch(API_BASE_URL, { method: 'POST', body: formData });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }

      if (!res.ok) {
        Alert.alert('บันทึกไม่สำเร็จ', data?.error || 'สร้างสินค้าไม่สำเร็จ');
      } else {
        Alert.alert('สำเร็จ', 'เพิ่มสินค้าเรียบร้อย!', [
          { text: 'ไปหน้าสินค้า', onPress: () => router.replace('/product') },
        ]);
        // เคลียร์ฟอร์ม
        setForm({
          Name: '',
          Description: '',
          Price: '',
          Stock: '',
          Category: '',
          Manufacturer: '',
          Rating: '0',
        });
        setImage(null);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>เพิ่มสินค้า</Text>

      <View style={styles.card}>
        <L label="Name">
          <I value={form.Name} onChangeText={(t) => onChange('Name', t)} placeholder="เช่น Pinky Rose" />
        </L>

        <L label="Description">
          <I
            multiline
            style={{ height: 120, textAlignVertical: 'top' }}
            value={form.Description}
            onChangeText={(t) => onChange('Description', t)}
            placeholder="รายละเอียด / จุดเด่น / กิมมิก ฯลฯ"
          />
        </L>

        {/* แถว Price + Stock */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <L label="Price (฿)">
              <I keyboardType="numeric" value={form.Price} onChangeText={(t) => onChange('Price', t)} placeholder="เช่น 1290" />
            </L>
          </View>
          <View style={{ flex: 1 }}>
            <L label="Stock">
              <I keyboardType="numeric" value={form.Stock} onChangeText={(t) => onChange('Stock', t)} placeholder="จำนวนคงเหลือ เช่น 10" />
            </L>
          </View>
        </View>

        {/* Rating แยกบรรทัด */}
        <L label="Rating (0-5)">
          <I keyboardType="numeric" value={form.Rating} onChangeText={(t) => onChange('Rating', t)} placeholder="เช่น 5" />
        </L>

        <L label="Category">
          <I value={form.Category} onChangeText={(t) => onChange('Category', t)} placeholder="เช่น Bouquet • Birthday" />
        </L>

        <L label="Manufacturer (ร้าน/สตูดิโอ)">
          <I value={form.Manufacturer} onChangeText={(t) => onChange('Manufacturer', t)} placeholder="เช่น Flora Bliss" />
        </L>

        <Text style={styles.label}>Image</Text>
        {image?.uri && <Image source={{ uri: image.uri }} style={styles.imagePreview} />}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
          <Text style={styles.btnSecondaryText}>เลือกภาพ</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 18 }}>
          <TouchableOpacity style={[styles.btnPrimary, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>บันทึกสินค้า</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const L: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const I: React.FC<any> = (props) => (
  <TextInput
    {...props}
    placeholderTextColor={COLORS.textMuted}
    style={[styles.input, props.style]}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.bg },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16, color: COLORS.text, textAlign: 'center' },
  label: { fontWeight: '700', fontSize: 13, marginBottom: 6, color: COLORS.text },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: COLORS.input,
    color: COLORS.text,
    fontSize: 15,
  },
  imagePreview: { width: '100%', height: 200, borderRadius: 14, marginVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: '#F7D6E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '900', textAlign: 'center' },
  btnSecondary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  btnSecondaryText: { color: COLORS.text, fontWeight: '800' },
});
