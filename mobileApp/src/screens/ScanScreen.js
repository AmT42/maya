import React, {useCallback, useMemo, useState} from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import BottomSheet from '../components/ui/BottomSheet';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import {useUser} from '../contexts/UserContext';
import {useTheme} from '../theme/theme';

const AUTO_SCAN_KEY = 'maya_auto_scan_v2';
const MAX_IMPORT_BYTES = 15 * 1024 * 1024;

const guessMimeType = (filename = '') => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'jpg' || ext === 'jpeg') {
    return 'image/jpeg';
  }
  if (ext === 'png') {
    return 'image/png';
  }
  if (ext === 'webp') {
    return 'image/webp';
  }
  if (ext === 'heic' || ext === 'heif') {
    return 'image/heic';
  }
  if (ext === 'pdf') {
    return 'application/pdf';
  }
  if (ext === 'txt') {
    return 'text/plain';
  }
  return 'application/octet-stream';
};

const getAttachmentKind = (mimeType = '', filename = '') => {
  const type = mimeType.toLowerCase();
  const name = filename.toLowerCase();
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (type.startsWith('text/')) {
    return 'text';
  }
  return 'file';
};

const formatBytes = bytes => {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return '';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(0)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
};

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
  const [attachment, setAttachment] = useState(null);
  const [docId, setDocId] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetVariant, setSheetVariant] = useState('review'); // review | guest
  const [info, setInfo] = useState(normalizeInfo(null));

  const previewUri = attachment?.kind === 'image' ? attachment.uri : '';

  const attachmentLabel = useMemo(() => {
    if (attachment?.source === 'import') {
      return 'Imported';
    }
    if (attachment?.source === 'photo') {
      return 'Photo';
    }
    return 'Scanned';
  }, [attachment?.source]);

  const attachmentHint = useMemo(() => {
    if (!attachment) {
      return '';
    }
    if (!isSignedIn) {
      return `${attachmentLabel} • Share or sign in to save`;
    }
    if (docId) {
      return `${attachmentLabel} • Save to your library`;
    }
    return `${attachmentLabel} • Upload to analyze`;
  }, [attachment, attachmentLabel, docId, isSignedIn]);

  const canConfirm = useMemo(() => {
    return info.doctype.trim() && info.expediteur.trim() && info.date.trim();
  }, [info]);

  const resetState = useCallback(() => {
    setSheetVisible(false);
    setAttachment(null);
    setDocId('');
    setInfo(normalizeInfo(null));
    setSheetVariant('review');
  }, []);

  const shareScan = useCallback(async () => {
    if (!attachment?.uri) {
      return;
    }
    try {
      await Share.share({
        url: attachment.uri,
        message: 'Scanned with Maya',
      });
    } catch (e) {
      // Ignore share cancellations / errors.
    }
  }, [attachment?.uri]);

  const processAttachment = useCallback(
    async nextAttachment => {
      setSheetVisible(false);
      setSheetVariant('review');
      setAttachment(nextAttachment);
      setDocId('');
      setInfo(normalizeInfo(null));

      if (!isSignedIn) {
        setSheetVariant('guest');
        setSheetVisible(true);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: nextAttachment.uri,
          type: nextAttachment.type,
          name: nextAttachment.name,
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
        const detail =
          e?.response?.data?.detail || e?.message || 'Please try again.';
        Alert.alert('Upload failed', detail.toString());
      }
    },
    [isSignedIn],
  );

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
      await processAttachment({
        uri,
        type: 'image/jpeg',
        name: 'scan.jpg',
        kind: 'image',
        source: 'scan',
      });
    } catch (e) {
      Alert.alert('Scan failed', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [processAttachment]);

  const handlePickedImage = useCallback(
    async (asset, source) => {
      const uri = asset?.uri;
      if (!uri) {
        Alert.alert('Photo failed', 'Could not access the selected photo.');
        return;
      }

      const name = asset?.fileName || `photo-${Date.now()}.jpg`;
      const type = (asset?.type || guessMimeType(name)).toLowerCase();
      const size = typeof asset?.fileSize === 'number' ? asset.fileSize : null;

      if (size && size > MAX_IMPORT_BYTES) {
        Alert.alert(
          'File too large',
          `Please choose a photo under ${formatBytes(MAX_IMPORT_BYTES)}.`,
        );
        return;
      }

      setBusy(true);
      try {
        await processAttachment({
          uri,
          type,
          name,
          kind: 'image',
          size,
          source,
        });
      } finally {
        setBusy(false);
      }
    },
    [processAttachment],
  );

  const chooseFromPhotos = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
      maxWidth: 2000,
      maxHeight: 2000,
      includeBase64: false,
      assetRepresentationMode: 'compatible',
    });

    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(
        'Photo failed',
        result.errorMessage || 'Could not open Photos.',
      );
      return;
    }

    await handlePickedImage(result.assets?.[0], 'photo');
  }, [handlePickedImage]);

  const takePhoto = useCallback(async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.9,
      maxWidth: 2000,
      maxHeight: 2000,
      includeBase64: false,
      saveToPhotos: false,
      assetRepresentationMode: 'compatible',
    });

    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert(
        'Camera failed',
        result.errorMessage || 'Could not open the camera.',
      );
      return;
    }

    await handlePickedImage(result.assets?.[0], 'photo');
  }, [handlePickedImage]);

  const addPhoto = useCallback(() => {
    const open = option => {
      if (option === 'camera') {
        takePhoto();
      }
      if (option === 'library') {
        chooseFromPhotos();
      }
    };

    if (Platform.OS === 'ios') {
      const options = ['Take photo', 'Choose from Photos', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {options, cancelButtonIndex: 2},
        index => {
          if (index === 0) {
            open('camera');
          }
          if (index === 1) {
            open('library');
          }
        },
      );
      return;
    }

    Alert.alert('Add photo', 'Choose a source', [
      {text: 'Take photo', onPress: () => open('camera')},
      {text: 'Choose from Photos', onPress: () => open('library')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  }, [chooseFromPhotos, takePhoto]);

  const importFile = useCallback(async () => {
    let picked;
    try {
      const options = {
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
        mode: 'import',
        presentationStyle: 'pageSheet',
      };
      if (DocumentPicker.pickSingle) {
        picked = await DocumentPicker.pickSingle(options);
      } else {
        const results = await DocumentPicker.pick(options);
        picked = results?.[0];
      }
    } catch (e) {
      if (DocumentPicker.isCancel?.(e)) {
        return;
      }
      Alert.alert('Import failed', 'Could not open the file picker.');
      return;
    }

    const uri = picked?.fileCopyUri || picked?.uri;
    if (!uri) {
      Alert.alert('Import failed', 'Could not access the selected file.');
      return;
    }

    const name = picked?.name || 'upload';
    const type = (picked?.type || guessMimeType(name)).toLowerCase();
    const kind = getAttachmentKind(type, name);
    const size = typeof picked?.size === 'number' ? picked.size : null;

    if (size && size > MAX_IMPORT_BYTES) {
      Alert.alert(
        'File too large',
        `Please choose a file under ${formatBytes(MAX_IMPORT_BYTES)}.`,
      );
      return;
    }

    if (kind !== 'image' && kind !== 'pdf' && kind !== 'text') {
      Alert.alert(
        'Unsupported file',
        'Please choose a PDF, image, or text document.',
      );
      return;
    }

    try {
      setBusy(true);
      await processAttachment({
        uri,
        type,
        name,
        kind,
        size,
        source: 'import',
      });
    } finally {
      setBusy(false);
    }
  }, [processAttachment]);

  const changeSource = useCallback(() => {
    const run = key => {
      if (key === 'scan') {
        resetState();
        scan();
      }
      if (key === 'photo') {
        resetState();
        addPhoto();
      }
      if (key === 'files') {
        resetState();
        importFile();
      }
    };

    if (Platform.OS === 'ios') {
      const options = ['Scan document', 'Add photo', 'Browse files', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {options, cancelButtonIndex: 3},
        index => {
          if (index === 0) {
            run('scan');
          }
          if (index === 1) {
            run('photo');
          }
          if (index === 2) {
            run('files');
          }
        },
      );
      return;
    }

    Alert.alert('Choose source', '', [
      {text: 'Scan document', onPress: () => run('scan')},
      {text: 'Add photo', onPress: () => run('photo')},
      {text: 'Browse files', onPress: () => run('files')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  }, [addPhoto, importFile, resetState, scan]);

  const uploadExisting = useCallback(async () => {
    if (!attachment) {
      return;
    }
    try {
      setBusy(true);
      await processAttachment(attachment);
    } finally {
      setBusy(false);
    }
  }, [attachment, processAttachment]);

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
        if (cancelled || busy || attachment || sheetVisible) {
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
    }, [attachment, busy, scan, sheetVisible]),
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text style={[styles.title, {color: theme.colors.text}]}>Scan</Text>
            <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
              Scan, photo, or file. Done.
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
          {attachment ? (
            <View style={{width: '100%'}}>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}>
                {attachment.kind === 'image' ? (
                  <Image source={{uri: previewUri}} style={styles.preview} />
                ) : (
                  <View
                    style={[
                      styles.filePreview,
                      {backgroundColor: theme.colors.surface2},
                    ]}>
                    <View
                      style={[
                        styles.fileIcon,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}>
                      <Icon
                        name={
                          attachment.kind === 'pdf'
                            ? 'document-text-outline'
                            : 'document-outline'
                        }
                        size={34}
                        color={theme.colors.accent}
                      />
                    </View>
                    <Text
                      style={[styles.fileName, {color: theme.colors.text}]}
                      numberOfLines={2}>
                      {(attachment.name || 'Imported file').toString()}
                    </Text>
                    <Text
                      style={[
                        styles.fileMeta,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {(attachment.kind || 'file').toString().toUpperCase()}
                      {attachment.size ? ` • ${formatBytes(attachment.size)}` : ''}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.previewHint,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {attachmentHint}
                </Text>
              </View>

              <View style={{marginTop: 14}}>
                {isSignedIn ? (
                  docId ? (
                    <Button
                      title="Review & save"
                      icon="checkmark-circle-outline"
                      onPress={() => {
                        setSheetVariant('review');
                        setSheetVisible(true);
                      }}
                      disabled={busy}
                      loading={busy}
                    />
                  ) : (
                    <Button
                      title="Upload & review"
                      icon="cloud-upload-outline"
                      onPress={uploadExisting}
                      disabled={busy}
                      loading={busy}
                    />
                  )
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
                  title={
                    attachment.source === 'import'
                      ? 'Choose another file'
                      : attachment.source === 'photo'
                        ? 'Choose another photo'
                      : 'Scan again'
                  }
                  variant="ghost"
                  icon={
                    attachment.source === 'import'
                      ? 'folder-open-outline'
                      : attachment.source === 'photo'
                        ? 'images-outline'
                        : 'scan-outline'
                  }
                  onPress={() => {
                    resetState();
                    if (attachment.source === 'import') {
                      importFile();
                    } else if (attachment.source === 'photo') {
                      addPhoto();
                    } else {
                      scan();
                    }
                  }}
                  disabled={busy}
                  style={{marginTop: 10}}
                />

                <Button
                  title="Change source"
                  variant="ghost"
                  icon="swap-horizontal-outline"
                  onPress={changeSource}
                  disabled={busy}
                  style={{marginTop: 6}}
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
                Tap Scan, Photos, or Files to add a document.
              </Text>
              <Button
                title="Scan document"
                icon="scan-outline"
                onPress={scan}
                loading={busy}
                disabled={busy}
                style={{marginTop: 16, width: '100%'}}
              />
              <View style={styles.readyRow}>
                <Button
                  title="Photos"
                  variant="secondary"
                  icon="images-outline"
                  onPress={addPhoto}
                  disabled={busy}
                  style={{flex: 1}}
                />
                <View style={{width: 10}} />
                <Button
                  title="Files"
                  variant="secondary"
                  icon="folder-open-outline"
                  onPress={importFile}
                  disabled={busy}
                  style={{flex: 1}}
                />
              </View>
              <Text style={[styles.readyFootnote, {color: theme.colors.muted}]}>
                Choose from Photos or Files (PDF/images), up to{' '}
                {formatBytes(MAX_IMPORT_BYTES)}.
              </Text>
            </View>
          )}
        </View>
      </View>

      <BottomSheet
        visible={sheetVisible}
        title={sheetVariant === 'guest' ? 'Save this document' : 'Review details'}
        onClose={() => setSheetVisible(false)}>
        {sheetVariant === 'guest' ? (
          <View style={styles.form}>
            <Text style={[styles.sheetBody, {color: theme.colors.textSecondary}]}>
              You can share this file now. Sign in to save it in Maya and unlock
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
              {attachment ? (
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
  readyFootnote: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  readyRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
  filePreview: {
    width: '100%',
    height: 340,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fileIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 8,
  },
  fileMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
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
