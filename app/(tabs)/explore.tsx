import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import {
  getCards,
  deleteCard,
  clearCollection,
  type CollectionCard,
} from '@/utils/storage';
import { CARD_ASPECT_RATIO } from '@/utils/crop';

const THUMB_W = 70;
const THUMB_H = THUMB_W / CARD_ASPECT_RATIO;

export default function CollectionScreen() {
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Ricarica dati ogni volta che la tab diventa visibile
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  async function loadCards() {
    const data = await getCards();
    setCards(data);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  }

  function handleDelete(card: CollectionCard) {
    Alert.alert(
      'Rimuovi carta',
      `Vuoi rimuovere ${card.name} dalla collezione?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(card.id);
            await loadCards();
          },
        },
      ]
    );
  }

  function handleClearAll() {
    if (cards.length === 0) return;
    Alert.alert(
      'Svuota collezione',
      `Rimuovere tutte le ${cards.length} carte?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Svuota',
          style: 'destructive',
          onPress: async () => {
            await clearCollection();
            setCards([]);
          },
        },
      ]
    );
  }

  // ── Confidence color ──────────────────────────────────────────

  function confidenceColor(c: number) {
    if (c >= 0.7) return '#2ECC71';
    if (c >= 0.4) return '#F39C12';
    return '#E74C3C';
  }

  // ── Render ────────────────────────────────────────────────────

  function renderCard({ item }: { item: CollectionCard }) {
    const imageUri = item.imageUrl || item.localImageUri;
    const date = new Date(item.scannedAt);
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    return (
      <TouchableOpacity
        style={s.card}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={s.thumb}
            contentFit="cover"
          />
        ) : (
          <View style={[s.thumb, s.thumbPlaceholder]}>
            <Text style={s.thumbEmoji}>🃏</Text>
          </View>
        )}

        {/* Info */}
        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={s.cardSub}>
            {item.set} · {item.number}
          </Text>
          <Text style={s.cardDate}>{dateStr}</Text>
        </View>

        {/* Right side */}
        <View style={s.cardRight}>
          <Text style={s.cardRarity}>{item.rarity}</Text>
          <Text style={[s.cardConf, { color: confidenceColor(item.confidence) }]}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>Collezione</Text>
          <Text style={s.subtitle}>
            {cards.length === 0
              ? 'Le tue carte Pokémon scansionate'
              : `${cards.length} cart${cards.length === 1 ? 'a' : 'e'} salvat${cards.length === 1 ? 'a' : 'e'}`}
          </Text>
        </View>
        {cards.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={handleClearAll}>
            <Text style={s.clearTxt}>Svuota</Text>
          </TouchableOpacity>
        )}
      </View>

      {cards.length === 0 ? (
        /* Empty state */
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🃏</Text>
          <Text style={s.emptyTitle}>Nessuna carta</Text>
          <Text style={s.emptyBody}>
            Scansiona la tua prima carta Pokémon dal tab Scanner e confermala per
            vederla qui.
          </Text>
        </View>
      ) : (
        /* Card list */
        <FlatList
          data={cards}
          keyExtractor={(item) => `${item.id}_${item.scannedAt}`}
          renderItem={renderCard}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF4444"
              colors={['#FF4444']}
            />
          }
          ListFooterComponent={
            <Text style={s.footer}>Tieni premuto per rimuovere una carta</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 2 },

  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E74C3C',
    marginTop: 6,
  },
  clearTxt: { color: '#E74C3C', fontSize: 12, fontWeight: '600' },

  // Empty state
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },

  // List
  list: { paddingHorizontal: 20, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: { fontSize: 24 },

  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardSub: { color: '#AAA', fontSize: 13, marginTop: 2 },
  cardDate: { color: '#666', fontSize: 11, marginTop: 4 },

  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  cardRarity: {
    color: '#F39C12',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardConf: { fontSize: 14, fontWeight: '800' },

  footer: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});
