import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../constants';

const Section = ({ icon, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionBody}>{children}</Text>
  </View>
);

const DataItem = ({ label, reason }) => (
  <View style={styles.dataItem}>
    <View style={styles.dataRow}>
      <View style={styles.dataDot} />
      <Text style={styles.dataLabel}>{label}</Text>
    </View>
    <Text style={styles.dataReason}>{reason}</Text>
  </View>
);

export const PrivacyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
          <Text style={styles.introTitle}>Gizliliğiniz Bizim İçin Önemli</Text>
          <Text style={styles.introText}>
            Verilerinizi yalnızca size daha iyi bir deneyim sunmak için kullanıyoruz. Bilgilerinizi
            üçüncü taraflarla paylaşmıyor ve satmıyoruz.
          </Text>
        </View>

        <Section icon="person-outline" title="Hangi Bilgileri Topluyoruz?">
          Uygulamayı kullanabilmeniz için aşağıdaki bilgileri topluyoruz. Her birinin neden
          gerekli olduğunu aşağıda açıklıyoruz.
        </Section>

        <View style={styles.dataList}>
          <DataItem
            label="Ad ve E-posta"
            reason="Hesabınızı oluşturmak ve sizi tanıyabilmek için kullanılır. Analiz geçmişinizi hesabınıza bağlamak için gereklidir."
          />
          <DataItem
            label="Cilt Tipi"
            reason="İçerikleri cilt tipinize göre analiz edebilmemiz için gereklidir. Örneğin hassas cilde zararlı olabilecek bir madde, yağlı cilt için güvenli olabilir."
          />
          <DataItem
            label="Taranan / Girilen İçerik Listeleri"
            reason="Ürün içeriklerini analiz edebilmek için kullanılır. Analiz geçmişinizde tekrar görüntüleyebilmeniz için cihazınızda saklanır."
          />
          <DataItem
            label="Analiz Geçmişi"
            reason="Daha önce analiz ettiğiniz ürünlere kolayca erişebilmeniz için cihazınızda yerel olarak saklanır."
          />
          <DataItem
            label="Kamera Erişimi (Opsiyonel)"
            reason="Ürün etiketlerini tarayarak içerikleri otomatik okuyabilmek için kullanılır. Yalnızca siz izin verdiğinizde etkinleşir."
          />
        </View>

        <Section icon="cloud-offline-outline" title="Verileriniz Nerede Saklanır?">
          Analiz geçmişiniz ve cilt tipi bilginiz cihazınızda yerel olarak saklanır. Sunucularımıza
          yalnızca içerik analizi sırasında, analiz edilecek metin gönderilir. Bu veriler analiz
          tamamlandıktan sonra sunucularımızda tutulmaz.
        </Section>

        <Section icon="trash-outline" title="Verilerimi Nasıl Silebilirim?">
          Analiz geçmişinizi Geçmiş sekmesinden istediğiniz zaman silebilirsiniz. Hesabınızı
          tamamen silmek için uygulamadan çıkış yapmanız yeterlidir; cihazınızdaki tüm
          verileriniz temizlenir.
        </Section>

        <Section icon="lock-closed-outline" title="Geri Bildirimleriniz">
          Ürün kullanım geri bildirimleriniz (olumlu/olumsuz), analiz kalitemizi iyileştirmek
          için anonim olarak kullanılır. Bu geri bildirimler kişisel bilgilerinizle
          ilişkilendirilmez.
        </Section>

        <Section icon="hand-left-outline" title="Üçüncü Taraf Paylaşımı">
          Kişisel bilgilerinizi hiçbir üçüncü tarafla paylaşmıyor, satmıyor veya
          kiralamıyoruz. İçerik analizi için kullanılan yapay zeka servisleri yalnızca
          bileşen metinlerini işler; kişisel bilgilerinize erişemez.
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sorularınız için: destek@cosmeticanalyzer.com
          </Text>
          <Text style={styles.footerDate}>Son güncelleme: Haziran 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  introTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  dataList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  dataItem: {
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  dataLabel: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  dataReason: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: 16,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 16,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textLight,
  },
  footerDate: {
    ...Typography.caption,
    color: Colors.textLight,
    marginTop: 4,
  },
});
