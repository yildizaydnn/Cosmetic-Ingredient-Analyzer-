import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { analyzeText } from '../services/api';

const parseIngredients = (text) => {
  return text
    .split(/[,\n]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0);
};

const MANUAL_STEPS = [
  'Icerikler ayristiriliyor...',
  'Veritabaninda araniyor...',
  'Analiz tamamlaniyor...',
];

const ManualLoadingBar = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // İlk adım progress
    Animated.timing(progressAnim, {
      toValue: 1 / MANUAL_STEPS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // Adım geçişleri
    const timers = MANUAL_STEPS.slice(1).map((_, i) =>
      setTimeout(() => {
        setStepIndex(i + 1);
        Animated.timing(progressAnim, {
          toValue: (i + 2) / MANUAL_STEPS.length,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }, (i + 1) * 5000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View style={styles.manualLoadingWrap}>
      <View style={styles.manualLoadingRow}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="flask" size={20} color={Colors.primary} />
        </Animated.View>
        <Text style={styles.manualLoadingText}>{MANUAL_STEPS[stepIndex]}</Text>
      </View>
      <View style={styles.manualProgressBar}>
        <Animated.View
          style={[
            styles.manualProgressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

export const ManualEntryScreen = ({ navigation }) => {
  const [productName, setProductName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { skinType } = useAuth();

  const handleAnalyze = async () => {
    const ingredients = parseIngredients(text);
    if (ingredients.length === 0) return;

    try {
      setLoading(true);
      const result = await analyzeText(text, skinType);
      if (!result.isCosmetic) {
        Alert.alert(
          'Kozmetik Ürün Değil',
          result.rejectionReason || 'Bu içerik listesi bir cilt bakım ürününe ait görünmüyor.',
        );
        return;
      }
      navigation.navigate('AnalysisResult', {
        analysisResult: result,
        productName: productName.trim() || null,
        source: 'manual',
      });
    } catch (error) {
      Alert.alert(
        'Analiz Başarısız',
        error.message || 'İçerikler analiz edilemedi. Bağlantınızı kontrol edip tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasteExample = () => {
    setText(
      'Water, Niacinamide, Glycerin, Hyaluronic Acid, Fragrance, Methylparaben, Vitamin E'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>İçerik Girin</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Ürün Adı</Text>
        <TextInput
          style={styles.productNameInput}
          placeholder="Örn: CeraVe Nemlendirici Krem"
          placeholderTextColor={Colors.textLight}
          value={productName}
          onChangeText={setProductName}
          editable={!loading}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>İçerik Listesi</Text>
        <Text style={styles.hint}>
          Ürünün içerik listesini yazın veya yapıştırın. Her içeriği virgülle ayırın.
        </Text>

        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Örn: Water, Glycerin, Niacinamide, Hyaluronic Acid..."
            placeholderTextColor={Colors.textLight}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        <TouchableOpacity onPress={handlePasteExample} style={styles.exampleButton} disabled={loading}>
          <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
          <Text style={styles.exampleText}>Örnek içerikleri yapıştır</Text>
        </TouchableOpacity>

        {text.length > 0 && (
          <View style={styles.countContainer}>
            <Ionicons name="flask-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.countText}>
              {parseIngredients(text).length} içerik algılandı
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {loading ? (
          <ManualLoadingBar />
        ) : (
          <GradientButton
            title="Icerikleri Analiz Et"
            onPress={handleAnalyze}
            style={[!text.trim() && styles.buttonDisabled]}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  label: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  textAreaContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    minHeight: 180,
  },
  productNameInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  textArea: {
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 160,
  },
  exampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  exampleText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  countText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  manualLoadingWrap: {
    paddingVertical: 12,
  },
  manualLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  manualLoadingText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 10,
  },
  manualProgressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  manualProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
