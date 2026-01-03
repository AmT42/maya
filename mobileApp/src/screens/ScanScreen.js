import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DocumentScanner from 'react-native-document-scanner-plugin';
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useTheme} from '../theme/theme';
const normalizeInfo = info => {
  const safe = info || {};
  return {
    doctype: (safe.doctype ?? '').toString(),
    expediteur: (safe.expediteur ?? '').toString(),
    date: (safe.date ?? '').toString(),
    recapitulatif: (safe.recapitulatif ?? '').toString(),
    google_calendar:
      safe.google_calendar == null ? '' : safe.google_calendar.toString(),
  };
};

const ScanScreen = ({navigation}) => {
  const theme = useTheme();

  const [busy, setBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [docId, setDocId] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [info, setInfo] = useState(normalizeInfo(null));

  const canConfirm = useMemo(() => {
    return info.doctype.trim() && info.expediteur.trim() && info.date.trim();
  }, [info]);

  const scan = async () => {
    try {
      setBusy(true);
      const {scannedImages} = await DocumentScanner.scanDocument();
      if (!scannedImages?.length) {
        return;
      }

      const uri = scannedImages[0];
      setPreviewUri(uri);

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'scan.jpg',
      });

      const response = await apiClient.post('/upload', formData);
      if (response.data?.doc_id && response.data?.extracted_info) {
        setDocId(response.data.doc_id);
        setInfo(normalizeInfo(response.data.extracted_info));
        setSheetVisible(true);
      } else {
        Alert.alert('Upload failed', 'Could not parse server response.');
      }
    } catch (e) {
      Alert.alert('Scan failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    try {
      setBusy(true);
      const payload = {doc_id: docId, extracted_info: info};
      const response = await apiClient.post('/validate', payload);
      if (response.data?.doc_id) {
        setSheetVisible(false);
        setPreviewUri('');
        setDocId('');
        navigation.navigate('Files');
      } else {
        Alert.alert('Save failed', 'Could not validate the document.');
      }
    } catch (e) {
      Alert.alert('Save failed', 'Could not validate the document.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.orb1, {backgroundColor: theme.colors.accent}]} />
        <View style={[styles.orb2, {backgroundColor: theme.colors.accent2}]} />

        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>Scan</Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Point, capture, and let Maya do the rest
          </Text>
        </View>

        <View style={styles.center}>
          {previewUri ? (
            <View style={{width: '100%'}}>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Image source={{uri: previewUri}} style={styles.preview} />
                <Text
                  style={[
                    styles.previewHint,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Captured • Review details to save
                </Text>
              </View>

              <View style={{marginTop: 14}}>
                <Button
                  title="Review details"
                  icon="create-outline"
                  onPress={() => setSheetVisible(true)}
                  disabled={busy || !docId}
                  loading={busy}
                />
                <Button
                  title="Scan again"
                  variant="secondary"
                  icon="scan-outline"
                  onPress={() => {
                    setSheetVisible(false);
                    setPreviewUri('');
                    setDocId('');
                    setInfo(normalizeInfo(null));
                    scan();
                  }}
                  disabled={busy}
                  style={{marginTop: 10}}
                />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={scan}
              disabled={busy}
              style={({pressed}) => [
                styles.scanOrb,
                {
                  backgroundColor: theme.colors.accent,
                  shadowColor: theme.colors.shadow,
                  opacity: busy ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}>
              {busy ? (
                <ActivityIndicator color="#001018" />
              ) : (
                <>
                  <Icon name="scan-outline" size={26} color="#001018" />
                  <Text style={styles.scanText}>Scan document</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        visible={sheetVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSheetVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, {color: theme.colors.text}]}>
                Review details
              </Text>
              <Pressable
                onPress={() => setSheetVisible(false)}
                style={({pressed}) => [{opacity: pressed ? 0.6 : 1}]}>
                <Icon
                  name="close"
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            <View style={styles.form}>
              <TextField
                label="Type"
                value={info.doctype}
                onChangeText={t => setInfo(p => ({...p, doctype: t}))}
                placeholder="invoice, contract…"
                autoCapitalize="none"
              />
              <TextField
                label="Sender"
                value={info.expediteur}
                onChangeText={t => setInfo(p => ({...p, expediteur: t}))}
                placeholder="company, landlord…"
                autoCapitalize="none"
                style={{marginTop: 12}}
              />
              <TextField
                label="Date (DD/MM/YYYY)"
                value={info.date}
                onChangeText={t => setInfo(p => ({...p, date: t}))}
                placeholder="01/01/2026"
                autoCapitalize="none"
                style={{marginTop: 12}}
              />
              <TextField
                label="Summary"
                value={info.recapitulatif}
                onChangeText={t => setInfo(p => ({...p, recapitulatif: t}))}
                placeholder="Short summary…"
                multiline
                numberOfLines={3}
                style={{marginTop: 12}}
              />
              <TextField
                label="Calendar (optional DD/MM/YYYY)"
                value={info.google_calendar}
                onChangeText={t => setInfo(p => ({...p, google_calendar: t}))}
                placeholder="Leave empty"
                autoCapitalize="none"
                style={{marginTop: 12}}
              />
            </View>

            <View style={styles.sheetActions}>
              <Button
                title="Confirm & save"
                icon="checkmark-circle-outline"
                onPress={confirm}
                disabled={!canConfirm || busy}
                loading={busy}
              />
              <Button
                title="Edit later"
                variant="ghost"
                icon="time-outline"
                onPress={() => setSheetVisible(false)}
                style={{marginTop: 10}}
              />
              {previewUri ? (
                <Text style={[styles.sheetNote, {color: theme.colors.muted}]}>
                  Saved documents appear in Files instantly.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orb1: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.14,
  },
  orb2: {
    position: 'absolute',
    bottom: 60,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 110,
  },
  scanOrb: {
    width: 220,
    height: 220,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 12},
    elevation: 12,
    gap: 10,
  },
  scanText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#001018',
  },
  previewCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
  },
  preview: {
    width: '100%',
    height: 340,
    borderRadius: 18,
    backgroundColor: '#111',
  },
  previewHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.40)',
    padding: 12,
  },
  sheet: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  form: {
    paddingTop: 6,
  },
  sheetActions: {
    paddingTop: 14,
  },
  sheetNote: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default ScanScreen;
