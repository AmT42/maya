import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import SegmentedControl from '../components/ui/SegmentedControl';
import IconButton from '../components/ui/IconButton';
import EmptyState from '../components/ui/EmptyState';
import {useTheme} from '../theme/theme';
import {buildStorageUrl} from '../utils/storageUrl';

const sortByDateDesc = documents => {
  const getTime = d => {
    const date = new Date(d?.date);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };
  return [...documents].sort((a, b) => getTime(b) - getTime(a));
};

const FilesScreen = ({navigation}) => {
  const theme = useTheme();
  const [tab, setTab] = useState('recents'); // recents | browse

  const [recentsLoading, setRecentsLoading] = useState(false);
  const [recentsRefreshing, setRecentsRefreshing] = useState(false);
  const [recents, setRecents] = useState([]);

  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [docs, setDocs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  const pageTitle = useMemo(() => {
    if (tab === 'recents') {
      return 'Files';
    }
    if (path.length === 0) {
      return 'Categories';
    }
    if (path.length === 1) {
      return path[0];
    }
    return path[1];
  }, [path, tab]);

  const fetchRecents = useCallback(async () => {
    setRecentsLoading(true);
    try {
      const response = await apiClient.get('/user/documents_filter');
      setRecents(sortByDateDesc(response.data || []));
    } catch (e) {
      setRecents([]);
    } finally {
      setRecentsLoading(false);
    }
  }, []);

  const fetchBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const endpoint = '/user/documents';
      const url = path.length
        ? `${endpoint}?path=${encodeURIComponent(path.join('/'))}`
        : endpoint;
      const response = await apiClient.get(url);

      if (path.length < 2) {
        setFolders(response.data || []);
        setDocs([]);
      } else {
        setDocs(sortByDateDesc(response.data || []));
        setFolders([]);
      }
    } catch (e) {
      setFolders([]);
      setDocs([]);
    } finally {
      setBrowseLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchRecents();
  }, [fetchRecents]);

  useEffect(() => {
    if (tab === 'browse') {
      fetchBrowse();
    }
  }, [fetchBrowse, tab]);

  const openPreview = filePath => {
    const url = buildStorageUrl(filePath);
    if (!url) {
      return;
    }
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  const onPressFolder = name => {
    setPath(p => [...p, name]);
  };

  const onPressBack = () => {
    setPath(p => p.slice(0, -1));
  };

  const headerRight = (
    <IconButton
      icon="scan-outline"
      accessibilityLabel="Scan"
      onPress={() => navigation.navigate('Scan')}
      style={{marginLeft: 12}}
    />
  );

  const renderRecent = ({item}) => {
    return (
      <Pressable
        onPress={() => openPreview(item.file_path)}
        style={({pressed}) => [
          styles.recentRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View style={styles.thumb}>
          <Image
            source={{uri: buildStorageUrl(item.file_path)}}
            style={styles.thumbImage}
            resizeMode="cover"
          />
        </View>
        <View style={{flex: 1}}>
          <Text
            style={[styles.rowTitle, {color: theme.colors.text}]}
            numberOfLines={1}>
            {(item.doctype || 'document').toString()}
          </Text>
          <Text
            style={[styles.rowSubtitle, {color: theme.colors.textSecondary}]}
            numberOfLines={1}>
            {(item.expediteur || '—').toString()} •{' '}
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
      </Pressable>
    );
  };

  const renderFolder = ({item}) => {
    return (
      <Pressable
        onPress={() => onPressFolder(item)}
        style={({pressed}) => [
          styles.folderItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <View
          style={[styles.folderIcon, {backgroundColor: theme.colors.surface2}]}>
          <Icon name="folder-outline" size={20} color={theme.colors.accent} />
        </View>
        <Text
          style={[styles.folderText, {color: theme.colors.text}]}
          numberOfLines={1}>
          {item}
        </Text>
        <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
      </Pressable>
    );
  };

  const renderDocThumb = ({item}) => {
    return (
      <Pressable
        onPress={() => openPreview(item.file_path)}
        style={({pressed}) => [styles.gridItem, {opacity: pressed ? 0.85 : 1}]}>
        <View
          style={[
            styles.gridCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <Image
            source={{uri: buildStorageUrl(item.file_path)}}
            style={styles.gridImage}
          />
          <View style={styles.gridMeta}>
            <Text
              style={[styles.gridDate, {color: theme.colors.textSecondary}]}
              numberOfLines={1}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const browseData = path.length < 2 ? folders : docs;
  const browseEmpty = !browseLoading && (browseData?.length || 0) === 0;
  const recentsEmpty = !recentsLoading && (recents?.length || 0) === 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            {pageTitle}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {color: theme.colors.textSecondary},
            ]}>
            {tab === 'recents' ? 'Recent scans' : 'Browse your library'}
          </Text>
        </View>
        {headerRight}
      </View>

      <View style={styles.switchRow}>
        <SegmentedControl
          options={[
            {label: 'Recents', value: 'recents'},
            {label: 'Browse', value: 'browse'},
          ]}
          value={tab}
          onChange={v => {
            setTab(v);
            if (v === 'browse') {
              setPath([]);
            }
          }}
        />
      </View>

      {tab === 'browse' && path.length > 0 ? (
        <View style={styles.breadcrumbRow}>
          <Pressable
            onPress={onPressBack}
            style={({pressed}) => [
              styles.breadcrumbButton,
              {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Icon name="chevron-back" size={18} color={theme.colors.text} />
            <Text style={[styles.breadcrumbText, {color: theme.colors.text}]}>
              Back
            </Text>
          </Pressable>
          <Text
            style={[styles.breadcrumbPath, {color: theme.colors.textSecondary}]}
            numberOfLines={1}>
            {path.join(' / ')}
          </Text>
        </View>
      ) : null}

      {tab === 'recents' ? (
        recentsEmpty ? (
          <EmptyState
            title="No documents yet"
            subtitle="Scan your first document to start building your library."
            icon="scan-outline"
            style={{marginTop: 28}}
          />
        ) : (
          <FlatList
            data={recents}
            keyExtractor={(item, index) =>
              item.id?.toString?.() || String(index)
            }
            renderItem={renderRecent}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={recentsRefreshing}
                tintColor={theme.colors.accent}
                onRefresh={async () => {
                  setRecentsRefreshing(true);
                  await fetchRecents();
                  setRecentsRefreshing(false);
                }}
              />
            }
          />
        )
      ) : browseEmpty ? (
        <EmptyState
          title="Nothing here"
          subtitle="Scan a document or try another category."
          icon="folder-open-outline"
          style={{marginTop: 28}}
        />
      ) : (
        <FlatList
          data={browseData}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : `${item}-${index}`
          }
          renderItem={path.length < 2 ? renderFolder : renderDocThumb}
          contentContainerStyle={styles.listContent}
          numColumns={path.length < 2 ? 1 : 2}
        />
      )}

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}>
        <View
          style={[
            styles.previewOverlay,
            {backgroundColor: 'rgba(0,0,0,0.78)'},
          ]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewVisible(false)}
          />
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <Image
              source={{uri: previewUrl}}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <Pressable
              onPress={() => setPreviewVisible(false)}
              style={({pressed}) => [
                styles.previewClose,
                {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Icon name="close" size={18} color={theme.colors.text} />
              <Text
                style={[styles.previewCloseText, {color: theme.colors.text}]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  switchRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '800',
  },
  breadcrumbPath: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
  },
  folderIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  gridItem: {
    flex: 1,
    padding: 6,
  },
  gridCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#111',
  },
  gridMeta: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  gridDate: {
    fontSize: 12,
    fontWeight: '800',
  },
  previewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  previewCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
  },
  previewImage: {
    width: '100%',
    height: 420,
    borderRadius: 18,
  },
  previewClose: {
    marginTop: 12,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewCloseText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});

export default FilesScreen;
