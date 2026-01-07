import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './_auth/AuthContext';

const API_BASE_URL = 'http://nindam.sytes.net:3010/api';

const COLORS = {
  bg: '#FFF8FB',
  card: '#FFFFFF',
  primary: '#FF8FB1',
  accent: '#FFD166',
  text: '#5B2A3D',
  textMuted: '#9C6C7A',
  border: '#F7D6E0',
  chip: '#FFE3EC',
  inputBg: '#FFF0F6',
};

interface ProductType {
  id: number; name: string; price: number; stock: number; category: string;
  imageUrl: string; manufacturer: string; rating: number; description: string;
}

const Chip: React.FC<{ text: string; tone?: 'pink' | 'yellow' }> = ({ text, tone = 'pink' }) => (
  <View
    style={[
      styles.chip,
      tone === 'yellow' && { backgroundColor: '#FFF3C4', borderColor: '#FFE8A3' },
    ]}
  >
    <Text style={[styles.chipText, tone === 'yellow' && { color: '#8A5A00' }]}>{text}</Text>
  </View>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <View style={{ flexDirection: 'row' }}>
    {Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: 14, color: i < rating ? COLORS.primary : '#E6B8C6', marginRight: 2 }}>
        {i < rating ? '★' : '☆'}
      </Text>
    ))}
  </View>
);

// ดึง Badge จาก Description
function extractBadge(desc: string, key: 'Cert' | 'Weight' | 'Color') {
  const m = desc?.match(new RegExp(`${key}\\s*:\\s*([^•\\n]+)`, 'i'));
  return m?.[1]?.trim();
}

/** 🔔 ใช้ window.alert บนเว็บ และ Alert.alert บนมือถือ */
function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // ให้ขึ้นบรรทัดใหม่สวย ๆ
    const text = message ? `${title}\n\n${message}` : title;
    window.alert(text);
  } else {
    Alert.alert(title, message);
  }
}

export default function ProductListPage() {
  const { user, authFetch } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // สำหรับซื้อ
  const [buyingFor, setBuyingFor] = useState<ProductType | null>(null);
  const [qty, setQty] = useState('1');
  const [buying, setBuying] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const lowStockAlertShown = useRef(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/products`);
      const data = await res.json();
      if (!Array.isArray(data)) return setProducts([]);

      setProducts(
        data.map((p: any) => ({
          id: Number(p.Id ?? p.id ?? 0),
          name: p.Name ?? p.name ?? '',
          price: Number(p.Price ?? p.price ?? 0),
          stock: Number(p.Stock ?? p.stock ?? 0),
          category: p.Category ?? p.category ?? '',
          imageUrl: typeof p.Image === 'string' && p.Image.startsWith('http') ? p.Image : `${API_BASE_URL}${p.Image}`,
          manufacturer: p.Manufacturer ?? p.manufacturer ?? '',
          rating: Number(p.Rating ?? p.rating ?? 0),
          description: p.Description ?? p.description ?? '',
        }))
      );
      lowStockAlertShown.current = false;
    } catch (err) {
      console.error(err);
      showAlert('ผิดพลาด', 'โหลดรายการสินค้าไม่สำเร็จ');
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // 🔔 เตือน admin ถ้ามี stock < 5
  useEffect(() => {
    if (user?.role === 'admin' && products.length > 0 && !lowStockAlertShown.current) {
      const lows = products.filter(p => p.stock > 0 && p.stock < 5);
      if (lows.length > 0) {
        const list = lows.slice(0, 5).map(p => `• ${p.name} — Qty: ${p.stock}`).join('\n');
        showAlert('สต็อกใกล้หมด', `${lows.length} รายการมีสต็อกต่ำกว่า 5\n\n${list}${lows.length > 5 ? '\n…' : ''}`);
        lowStockAlertShown.current = true;
      }
    }
  }, [products, user]);

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showAlert('ลบสินค้าแล้ว');
      } else {
        showAlert('ลบไม่สำเร็จ', await res.text());
      }
    } catch (e) {
      console.error(e);
      showAlert('ผิดพลาด', 'ไม่สามารถลบสินค้าได้');
    }
  };

  // ซื้อสินค้า
  const handleBuy = (p: ProductType) => {
    if (p.stock <= 0) {
      showAlert('สินค้าหมด', 'ขออภัย สินค้าหมดชั่วคราว');
      return;
    }
    setBuyingFor(p);
    setQty('1');
  };

  const confirmBuy = async () => {
    if (!buyingFor) return;
    const q = Math.max(1, Math.min(Number(qty) || 1, buyingFor.stock)); // 1..stock
    setBuying(true);
    try {
      // พยายามเรียก endpoint ซื้อ
      const buyRes = await authFetch(`${API_BASE_URL}/products/${buyingFor.id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: q }),
      });

      if (buyRes.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === buyingFor.id ? { ...p, stock: Math.max(0, p.stock - q) } : p))
        );
        showAlert('สั่งซื้อสำเร็จ', `${buyingFor.name} — Qty: ${q}`);
      } else {
        // Fallback: PUT (ต้องมีสิทธิ์ admin)
        const newStock = Math.max(0, buyingFor.stock - q);
        const fd = new FormData();
        fd.append('Stock', String(newStock));

        const putRes = await authFetch(`${API_BASE_URL}/products/${buyingFor.id}`, {
          method: 'PUT',
          body: fd,
        });
        if (!putRes.ok) {
          const t = await putRes.text();
          console.error('PUT error:', t);
          throw new Error('ไม่สามารถอัปเดตสต็อกได้');
        }
        setProducts(prev =>
          prev.map(p => (p.id === buyingFor.id ? { ...p, stock: newStock } : p))
        );
        showAlert('สั่งซื้อสำเร็จ', `${buyingFor.name} — Qty: ${q}`);
      }
    } catch (e: any) {
      showAlert('ผิดพลาด', e?.message || 'ไม่สามารถสั่งซื้อได้');
    } finally {
      setBuying(false);
      setBuyingFor(null);
    }
  };

  // 🔎 ฟิลเตอร์สินค้า
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const text = [p.name, p.category, p.manufacturer, p.description, String(p.price), String(p.stock)]
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [products, query]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 8, color: COLORS.textMuted }}>กำลังโหลดดอกไม้...</Text>
      </View>
    );

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl tintColor={COLORS.textMuted} refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🔎 ช่องค้นหา */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ค้นหาดอกไม้ (ชื่อ, หมวด, ร้าน, คำอธิบาย)"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.resultCount}>
          พบ {filteredProducts.length} รายการ
          {query ? ` สำหรับ "${query}"` : ''}
        </Text>

        <Animated.View style={{ opacity: fade }}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>ไม่พบสินค้า ตรงกับคำค้น</Text>
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={[styles.emptyText, { textDecorationLine: 'underline' }]}>ล้างคำค้น</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredProducts.map((product) => {
                const cert = extractBadge(product.description, 'Cert');
                const weight = extractBadge(product.description, 'Weight');
                const color = extractBadge(product.description, 'Color');

                const stockText =
                  product.stock > 0
                    ? (product.stock < 5 ? `ใกล้หมด ${product.stock}` : `พร้อมส่ง ${product.stock}`)
                    : 'หมดชั่วคราว';

                // สีข้อความจำนวนคงเหลือ
                const qtyStyle = [styles.stock];
                if (product.stock === 0) qtyStyle.push(styles.outStock);
                else if (product.stock < 5) qtyStyle.push(styles.lowStock);
                else qtyStyle.push(styles.inStock);

                return (
                  <View key={product.id} style={styles.cardWrapper}>
                    <View style={styles.card}>
                      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                      <View style={styles.meta}>
                        <Text style={styles.productName}>{product.name}</Text>

                        <View style={styles.metaRow}>
                          <Text style={styles.price}>฿{product.price.toLocaleString()}</Text>
                          <StarRating rating={Math.min(5, Math.round(product.rating))} />
                        </View>

                        <View style={styles.badgeRow}>
                          {product.category ? <Chip text={product.category} /> : null}
                          {color ? <Chip text={color} tone="yellow" /> : null}
                          {cert ? <Chip text={cert} /> : null}
                          {weight ? <Chip text={`${weight}`} /> : null}
                        </View>

                        <Text numberOfLines={2} style={styles.desc}>
                          {product.description || `${product.category} • ${product.manufacturer}`}
                        </Text>

                        <View style={styles.actionRow}>
                          <Text style={qtyStyle as any}>{stockText}</Text>

                          {/* ปุ่ม admin */}
                          {user?.role === 'admin' && (
                            <View style={{ flexDirection: 'row' }}>
                              <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push({ pathname: '/edit/[id]', params: { id: String(product.id) } })}
                              >
                                <Text style={styles.actionText}>แก้ไข</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.delButton} onPress={() => handleDelete(product.id)}>
                                <Text style={styles.actionText}>ลบ</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* ปุ่มซื้อ เฉพาะ user */}
                          {user && user.role === 'user' && (
                            <TouchableOpacity
                              disabled={product.stock <= 0}
                              style={[styles.buyBtn, product.stock <= 0 && { opacity: 0.5 }]}
                              onPress={() => handleBuy(product)}
                            >
                              <Text style={styles.buyText}>ซื้อ</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal ซื้อ */}
      <Modal visible={!!buyingFor} transparent animationType="fade" onRequestClose={() => setBuyingFor(null)}>
        <Pressable style={styles.modalBack} onPress={() => !buying && setBuyingFor(null)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>สั่งซื้อ: {buyingFor?.name}</Text>
            <Text style={{ color: COLORS.textMuted, marginBottom: 10 }}>
              คงเหลือ: {buyingFor?.stock} ชิ้น
            </Text>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQty(String(Math.max(1, (Number(qty) || 1) - 1)))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.qtyInput}
                keyboardType="numeric"
                value={qty}
                onChangeText={(t) => {
                  const v = Math.max(1, Math.min(Number(t) || 1, buyingFor?.stock ?? 1));
                  setQty(String(v));
                }}
              />
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  setQty(String(Math.min((buyingFor?.stock ?? 1), (Number(qty) || 1) + 1)))
                }
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.card }]}
                onPress={() => !buying && setBuyingFor(null)}
              >
                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.primary }]} onPress={confirmBuy} disabled={buying}>
                {buying ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>ยืนยันซื้อ</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, backgroundColor: COLORS.bg },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBox: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { color: COLORS.text, fontSize: 15, paddingRight: 28 },
  clearBtn: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 6 },
  clearText: { color: COLORS.textMuted, fontSize: 22, lineHeight: 22 },
  resultCount: { color: COLORS.textMuted, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { width: '48%', marginBottom: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20, overflow: 'hidden', elevation: 2,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#F7D6E0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.6, shadowRadius: 10,
  },
  productImage: { width: '100%', height: 160 },
  meta: { padding: 12 },
  productName: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { color: COLORS.primary, fontWeight: '900' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: COLORS.chip, borderWidth: 1, borderColor: '#F7CAD0',
  },
  chipText: { fontSize: 11, color: '#7A3B4A', fontWeight: '700' },
  desc: { marginTop: 8, color: COLORS.textMuted, fontSize: 12, minHeight: 36 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },

  // สีข้อความจำนวนคงเหลือ
  stock: { fontSize: 12 },
  inStock: { color: '#4CAF50', fontWeight: '700' },  // สต็อกปกติ
  lowStock: { color: '#E57373', fontWeight: '900' }, // < 5
  outStock: { color: '#E53935', fontWeight: '900' }, // = 0

  editButton: {
    marginRight: 8, backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  delButton: {
    backgroundColor: '#FDE7EF', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  buyBtn: {
    marginLeft: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buyText: { fontWeight: '800', color: COLORS.text },

  emptyWrap: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { color: COLORS.textMuted, marginBottom: 6 },

  // Modal ซื้อ
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  qtyBtn: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  qtyBtnText: { fontWeight: '900', color: COLORS.text, fontSize: 18 },
  qtyInput: {
    minWidth: 70, textAlign: 'center', backgroundColor: COLORS.inputBg, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 8,
  },
  modalBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 4,
  },
  modalBtnText: { fontWeight: '900' },
});
