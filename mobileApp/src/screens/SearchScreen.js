import React, {useMemo, useState} from 'react';
import {FlatList, Image, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../services/apiClient';
import Screen from '../components/ui/Screen';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import {useTheme} from '../theme/theme';
import {buildStorageUrl} from '../utils/storageUrl';

const SearchScreen = () => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  const runSearch = async () => {
    if (!canSearch) {
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await apiClient.get(
        `/user/search?query=${encodeURIComponent(query.trim())}&top_k=10`,
      );
      setResults(response.data || []);
    } catch (e) {
      // DEV mode returns [] and full mode may 404 on no results
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}) => {
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}>
        <View style={styles.thumb}>
          <Image
            source={{uri: buildStorageUrl(item.file_path)}}
            style={styles.thumbImage}
          />
        </View>
        <View style={{flex: 1}}>
          <Text
            style={[styles.title, {color: theme.colors.text}]}
            numberOfLines={1}>
            {(item.doctype || 'document').toString()}
          </Text>
          <Text
            style={[styles.subtitle, {color: theme.colors.textSecondary}]}
            numberOfLines={1}>
            {(item.expediteur || '—').toString()} •{' '}
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Icon name="sparkles-outline" size={18} color={theme.colors.accent2} />
      </View>
    );
  };

  const showEmpty = hasSearched && !loading && results.length === 0;
  const showHint = !hasSearched && query.trim().length === 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Search
        </Text>
        <Text
          style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
          Find a document instantly
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={{flex: 1}}>
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Try “invoice”, “rent”, “tax”…"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={runSearch}
          />
        </View>
        <View style={{width: 12}} />
        <Button
          title="Go"
          icon="search-outline"
          onPress={runSearch}
          disabled={!canSearch}
          loading={loading}
          style={{width: 92}}
        />
      </View>

      {showHint ? (
        <EmptyState
          title="Search your documents"
          subtitle="Type a keyword and press Go."
          icon="sparkles-outline"
          style={{marginTop: 28}}
        />
      ) : showEmpty ? (
        <EmptyState
          title="No results"
          subtitle="Try a different keyword."
          icon="search-outline"
          style={{marginTop: 28}}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => item.id?.toString?.() || String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SearchScreen;
