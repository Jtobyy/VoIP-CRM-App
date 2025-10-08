import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useLoading } from '../../../hooks/useLoading';
import SuccessModal from '../../../components/Modals/more/HelpAndSupport'
import { colors } from '../../../styles/global';


const SUPPORT_PHONE = '+234 803 567 0547';
const SUPPORT_EMAIL = 'hello@nativetalk.io';

export default function HelpSupport({ navigation }) {
  const { loading, setLoading } = useLoading();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCall = () => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`);
  const handleEmailTap = () =>
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20Request&body=`);

  const handleSend = async () => {
    if (!title.trim() || !comment.trim()) return;

    try {
      setLoading(true);

      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        title.trim()
      )}&body=${encodeURIComponent(comment.trim())}`;
      await Linking.openURL(mailto);

      setShowSuccess(true);
      setTitle('');
      setComment('');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !title.trim() || !comment.trim();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />

      {/* Header */}
      <ImageBackground
        source={require('../../../assets/header_bg.png')}
        style={styles.header}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../../assets/backWhite.png')} style={styles.backButtonIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.headerRight} />
      </ImageBackground>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} bounces={false} showsVerticalScrollIndicator={false}>
          {/* Avatar + helper text */}
          <View style={styles.heroWrap}>
            <Image
              source={require('../../../assets/contact_support.png')}
              style={styles.hero}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>We are here to help, kindly get{'\n'}in touch with us</Text>
          </View>

          {/* Contact rows */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#E8F8EC' }]}>
              <Image source={require('../../../assets/call_ic.png')} style={styles.icon} />
            </View>
            <TouchableOpacity onPress={handleCall}>
              <Text style={styles.rowText}>{SUPPORT_PHONE}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: '#EAF2FF' }]}>
              <Image source={require('../../../assets/mail_ic.png')} style={styles.icon} />
            </View>
            <TouchableOpacity onPress={handleEmailTap}>
              <Text style={styles.rowText}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter your title here"
            placeholderTextColor="#A6A6A6"
            style={styles.input}
            returnKeyType="next"
          />

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Comments"
            placeholderTextColor="#9AA0A6"
            style={styles.textarea}
            textAlignVertical="top"
            multiline
            numberOfLines={6}
          />

          {/* Send button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={disabled}
            style={[styles.btn, disabled && styles.btnDisabled]}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal visible={showSuccess} onClose={() => setShowSuccess(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 5 },
  backButtonIcon: { width: 20, height: 20 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#ffffff', flex: 1, textAlign: 'center' },
  headerRight: { width: 34 },

  body: { padding: 20, paddingBottom: 32 },

  heroWrap: { alignItems: 'center', marginTop: 6, marginBottom: 14 },
  hero: { width: 120, height: 120, marginBottom: 6 },
  heroTitle: { textAlign: 'center', color: '#1E1E1E', fontSize: 14, lineHeight: 20 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 41, height: 41, resizeMode: 'contain' },
  rowText: { color: '#111827', fontSize: 14 },

  input: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    minHeight: 140,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },

  btn: {
    marginTop: 18,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#34C759',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  btnBottomEdge: {
    position: 'absolute',
    bottom: 5,
    left: 10,
    right: 10,
    height: 4,
    backgroundColor: '#E7FFE8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});