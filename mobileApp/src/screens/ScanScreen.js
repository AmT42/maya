import React, {useCallback, useMemo, useState} from 'react';
import {Alert, Image, Pressable, Share, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import BottomSheet from '../components/ui/BottomSheet';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useUser} from '../contexts/UserContext';
import {useTheme} from '../theme/theme';

const AUTO_SCAN_KEY = 'maya_auto_scan_v2';

const formatDateDDMMYYYY = date => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = value => String(value).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const normalizeInfo = info => {
  const safe = info || {};
  const today = formatDateDDMMYYYY(new Date());

  const doctype = (safe.doctype ?? 'document').toString().trim() || 'document';
  const expediteur =
    (safe.expediteur ?? 'unknown').toString().trim() || 'unknown';
  const date = (safe.date ?? today).toString().trim() || today;
  const recapitulatif = (safe.recapitulatif ?? '').toString();
  const google_calendar =
    safe.google_calendar == null ? '' : safe.google_calendar.toString();

  return {doctype, expediteur, date, recapitulatif, google_calendar};
};

const ScanScreen = ({navigation}) => {
  const theme = useTheme();
  const {user} = useUser();
  const isSignedIn = Boolean(user);

  const [busy, setBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState('');
  const [docId, setDocId] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetVariant, setSheetVariant] = useState('review'); // review | guest
  const [info, setInfo] = useState(normalizeInfo(null));

  const canConfirm = useMemo(() => {
    return info.doctype.trim() && info.expediteur.trim() && info.date.trim();
  }, [info]);

  const resetState = useCallback(() => {
    setSheetVisible(false);
    setPreviewUri('');
    setDocId('');
    setInfo(normalizeInfo(null));
    setSheetVariant('review');
  }, []);

  const shareScan = useCallback(async () => {
    if (!previewUri) {
      return;
    }
    try {
      await Share.share({
        url: previewUri,
        message: 'Scanned with Maya',
      });
    } catch (e) {
      // Ignore share cancellations / errors.
    }
  }, [previewUri]);

  const scan = useCallback(async () => {
    try {
      setBusy(true);
      const {scannedImages} = await DocumentScanner.scanDocument({
        croppedImageQuality: 90,
        maxNumDocuments: 1,
      });

      if (!scannedImages?.length) {
        return;
      }

      const uri = scannedImages[0];
      setPreviewUri(uri);

      if (!isSignedIn) {
        setSheetVariant('guest');
        setSheetVisible(true);
        return;
      }

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
        setSheetVariant('review');
        setSheetVisible(true);
      } else {
        Alert.alert('Upload failed', 'Could not parse server response.');
      }
    } catch (e) {
      Alert.alert('Scan failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [isSignedIn]);

  const confirm = useCallback(async () => {
    try {
      setBusy(true);
      const payload = {doc_id: docId, extracted_info: info};
      const response = await apiClient.post('/validate', payload);
      if (response.data?.doc_id) {
        resetState();
        navigation.navigate('Files');
      } else {
        Alert.alert('Save failed', 'Could not validate the document.');
      }
    } catch (e) {
      Alert.alert('Save failed', 'Could not validate the document.');
    } finally {
      setBusy(false);
    }
  }, [docId, info, navigation, resetState]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const run = async () => {
        if (cancelled || busy || previewUri || sheetVisible) {
          return;
        }

        const already = await AsyncStorage.getItem(AUTO_SCAN_KEY);
        if (already) {
          return;
        }

        await AsyncStorage.setItem(AUTO_SCAN_KEY, '1');
        if (!cancelled) {
          scan();
        }
      };

      run();
      return () => {
        cancelled = true;
      };
    }, [busy, previewUri, scan, sheetVisible]),
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={[styles.title, {color: theme.colors.text}]}>Scan</Text>
            <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
              Point. Capture. Done.
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Files')}
            style={({pressed}) => [
              styles.headerChip,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open library">
            <Icon name="folder-outline" size={18} color={theme.colors.text} />
          </Pressable>
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
                  {isSignedIn
                    ? 'Captured • Save to your library'
                    : 'Captured • Share or sign in to save'}
                </Text>
              </View>

              <View style={{marginTop: 14}}>
                {isSignedIn ? (
                  <Button
                    title="Review & save"
                    icon="checkmark-circle-outline"
                    onPress={() => {
                      setSheetVariant('review');
                      setSheetVisible(true);
                    }}
                    disabled={busy || !docId}
                    loading={busy && !docId}
                  />
                ) : (
                  <>
                    <Button
                      title="Sign in to save"
                      icon="log-in-outline"
                      onPress={() => navigation.navigate('Auth')}
                      disabled={busy}
                    />
                    <Button
                      title="Share"
                      variant="secondary"
                      icon="share-outline"
                      onPress={shareScan}
                      disabled={busy}
                      style={{marginTop: 10}}
                    />
                  </>
                )}

                <Button
                  title="Scan again"
                  variant="ghost"
                  icon="scan-outline"
                  onPress={() => {
                    resetState();
                    scan();
                  }}
                  disabled={busy}
                  style={{marginTop: 10}}
                />
              </View>
            </View>
          ) : (
            <View style={styles.ready}>
              <View
                style={[
                  styles.readyIcon,
                  {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Icon name="scan-outline" size={22} color={theme.colors.accent} />
              </View>
              <Text style={[styles.readyTitle, {color: theme.colors.text}]}>
                Ready to scan
              </Text>
              <Text
                style={[
                  styles.readySubtitle,
                  {color: theme.colors.textSecondary},
                ]}>
                Tap Scan to capture your first document.
              </Text>
              <Button
                title="Scan"
                icon="scan-outline"
                onPress={scan}
                loading={busy}
                disabled={busy}
                style={{marginTop: 16, width: '100%'}}
              />
            </View>
          )}
        </View>
      </View>

      <BottomSheet
        visible={sheetVisible}
        title={sheetVariant === 'guest' ? 'Save this scan' : 'Review details'}
        onClose={() => setSheetVisible(false)}>
        {sheetVariant === 'guest' ? (
          <View style={styles.form}>
            <Text style={[styles.sheetBody, {color: theme.colors.textSecondary}]}>
              You can share this scan now. Sign in to save it in Maya and unlock
              search.
            </Text>
          </View>
        ) : (
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
              placeholder={formatDateDDMMYYYY(new Date())}
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
        )}

        <View style={styles.sheetActions}>
          {sheetVariant === 'guest' ? (
            <>
              <Button
                title="Sign in"
                icon="log-in-outline"
                onPress={() => {
                  setSheetVisible(false);
                  navigation.navigate('Auth');
                }}
                disabled={busy}
              />
              <Button
                title="Share"
                variant="secondary"
                icon="share-outline"
                onPress={shareScan}
                disabled={busy}
                style={{marginTop: 10}}
              />
              <Button
                title="Not now"
                variant="ghost"
                icon="close-circle-outline"
                onPress={() => setSheetVisible(false)}
                style={{marginTop: 10}}
              />
            </>
          ) : (
            <>
              <Button
                title="Save"
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
                  Saved documents appear in Library instantly.
                </Text>
              ) : null}
            </>
          )}
        </View>
      </BottomSheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  ready: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    padding: 16,
  },
  readyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  readySubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
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
  sheetBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
