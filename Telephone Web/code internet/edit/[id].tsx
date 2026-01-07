// app/edit/[id].tsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useAuth } from '../_auth/AuthContext'; // <-- สำคัญ: เปลี่ยนเป็น ../_auth

const API_BASE_URL = 'http://nindam.sytes.net:3010/api';

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

export default function EditProductPage() {
  // ใช้ชื่อ authLoading กันชนกับ loading ของหน้านี้
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<any>(null);

  // guard เฉพาะ admin
  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      Alert.alert('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบเท่านั้น');
      router.replace('/product');
    }
  }, [authLoading, user]);

  // ดึงข้อมูลสินค้า
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        const data = await res.json();
        setProduct(data);
        const img =
          typeof data.Image === 'string' && data.Image.startsWith('http')
            ? data.Image
            : `${API_BASE_URL}${data.Image || ''}`;
        setImage(img ? { uri: img } : null);
      } catch (e) {
        Alert.alert('Error', 'Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

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

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('Name', product.Name ?? '');
      formData.append('Description', product.Description ?? '');
      formData.append('Price', String(product.Price ?? '0'));
      formData.append('Stock', String(product.Stock ?? '0'));
      formData.append('Category', product.Category ?? '');
      formData.append('Manufacturer', product.Manufacturer ?? '');
      formData.append('Rating', String(product.Rating ?? '0'));

      if (image?.uri) {
        if (image.uri.startsWith('data:')) {
          const blob = await (await fetch(image.uri)).blob();
          formData.append('Image', blob, image.name || 'photo.jpg');
        } else if (!image.uri.startsWith('http')) {
          const fileExt = (image.uri.split('.').pop() || 'jpg').split('?')[0];
          formData.append('Image', {
            uri: image.uri,
            name: `photo.${fileExt}`,
            type: image.type || 'image/jpeg',
          } as any);
        }
      }

      const res = await authFetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        body: formData,
      });

      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }

      if (!res.ok) {
        Alert.alert('Error', data?.error || 'Update failed');
      } else {
        Alert.alert('Success', 'Product updated successfully!');
        router.back();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.title}>แก้ไขสินค้า #{id}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={product?.Name ?? ''}
          onChangeText={(text) => setProduct({ ...product, Name: text })}
          placeholder="ชื่อสินค้า"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
          multiline
          value={product?.Description ?? ''}
          onChangeText={(text) => setProduct({ ...product, Description: text })}
          placeholder="คำอธิบาย / สเปก / สี / โอกาส"
          placeholderTextColor={COLORS.textMuted}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Price (฿)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(product?.Price ?? '')}
              onChangeText={(text) => setProduct({ ...product, Price: Number(text) || 0 })}
              placeholder="เช่น 1290"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(product?.Stock ?? '')}
              onChangeText={(text) => setProduct({ ...product, Stock: Number(text) || 0 })}
              placeholder="จำนวนคงเหลือ"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={product?.Category ?? ''}
          onChangeText={(text) => setProduct({ ...product, Category: text })}
          placeholder="เช่น Bouquet • Birthday"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Manufacturer (ร้าน/สตูดิโอ)</Text>
        <TextInput
          style={styles.input}
          value={product?.Manufacturer ?? ''}
          onChangeText={(text) => setProduct({ ...product, Manufacturer: text })}
          placeholder="เช่น Flora Bliss"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Rating (0-5)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(product?.Rating ?? '')}
          onChangeText={(text) => setProduct({ ...product, Rating: Number(text) || 0 })}
          placeholder="เช่น 5"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Image</Text>
        {image?.uri ? <Image source={{ uri: image.uri }} style={styles.imagePreview} /> : null}
        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
          <Text style={styles.btnSecondaryText}>เลือกภาพ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 18 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>บันทึกการเปลี่ยนแปลง</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.bg },
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
  title: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontWeight: '700', fontSize: 14, marginTop: 12, color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
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
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '900' },
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
