import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraOverlay } from '@/components/camera-overlay';
import { ConfidenceBar } from '@/components/confidence-bar';
import { calculateCardCrop, CARD_ASPECT_RATIO } from '@/utils/crop';
import {
  autoRecognizeCard,
  searchCardByName,
  type ScanResult,
} from '@/utils/api';
import { saveCard, type CollectionCard } from '@/utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_W = SCREEN_WIDTH * 0.7;
const PREVIEW_H = PREVIEW_W / CARD_ASPECT_RATIO;

// ── Flusso: idle → scanning → recognizing → result ──────────────
//    Se il riconoscimento automatico fallisce → preview (input manuale)
type Phase =
  | 'idle'
  | 'scanning'
  | 'recognizing'
  | 'preview'
  | 'searching'
  | 'result';

export default function ScannerScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [phase, setPhase] = useState<Phase>('idle');
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const busyRef = useRef(false);

  // ── Cattura + Crop + Riconoscimento automatico ─────────────────

  const captureAndCrop = useCallback(async () => {
    if (!cameraRef.current || busyRef.current) return;
    busyRef.current = true;
    setPhase('scanning');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (!photo) throw new Error('Foto nulla');

      setStatusMsg('Elaborazione immagine...');

      // 1) Ridimensiona a 1024px (alta ris. per leggere codice in basso)
      //    CON base64 → questa immagine INTERA va all'OCR
      const resized = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { format: SaveFormat.JPEG, compress: 0.8, base64: true }
      );

      // 2) Crop carta (solo per la preview visiva)
      const crop = calculateCardCrop(resized.width, resized.height);
      const cropped = await manipulateAsync(
        resized.uri,
        [{ crop }],
        { format: SaveFormat.JPEG, compress: 0.7 }
      );

      setCroppedUri(cropped.uri);

      // 3) Riconoscimento automatico — usa immagine INTERA per OCR
      //    (non la croppata, perché il codice carta è in basso!)
      if (resized.base64) {
        setPhase('recognizing');
        setStatusMsg('Invio immagine per OCR...');

        const found = await autoRecognizeCard(resized.base64, setStatusMsg);
        if (found) {
          setResult(found);
          setPhase('result');
          busyRef.current = false;
          return;
        }
      }

      // OCR fallito → input manuale
      setPhase('preview');
    } catch (e) {
      console.error('[Scanner]', e);
      Alert.alert('Errore', 'Impossibile scattare la foto. Riprova.');
      setPhase('idle');
    } finally {
      busyRef.current = false;
    }
  }, []);

  // ── Ricerca manuale (fallback) ─────────────────────────────────

  const handleSearch = useCallback(async () => {
    const name = cardName.trim();
    if (name.length < 2) {
      Alert.alert('Nome troppo corto', 'Scrivi almeno 2 caratteri.');
      return;
    }

    setPhase('searching');
    const found = await searchCardByName(name);

    if (found) {
      setResult(found);
      setPhase('result');
    } else {
      Alert.alert(
        'Non trovata',
        `Nessuna carta "${name}" trovata.\nControlla il nome e riprova.`
      );
      setPhase('preview');
    }
  }, [cardName]);

  // ── Reset ─────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setCroppedUri(null);
    setCardName('');
    setStatusMsg('');
    setResult(null);
    setPhase('idle');
  }, []);

  // ── Conferma → salva in collezione ────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!result) return;

    const card: CollectionCard = {
      id: result.id || `scan_${Date.now()}`,
      name: result.name,
      set: result.set,
      number: result.number,
      rarity: result.rarity ?? 'Unknown',
      confidence: result.confidence,
      imageUrl: result.imageUrl,
      localImageUri: croppedUri ?? undefined,
      scannedAt: new Date().toISOString(),
    };

    await saveCard(card);
    Alert.alert('Carta salvata!', `${result.name} aggiunta alla collezione.`, [
      { text: 'OK', onPress: reset },
    ]);
  }, [result, croppedUri, reset]);

  // ── Permission ────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#FF4444" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.permWrap}>
        <View style={s.permCard}>
          <Text style={s.permEmoji}>📷</Text>
          <Text style={s.permTitle}>Accesso Fotocamera</Text>
          <Text style={s.permBody}>
            Serve l&apos;accesso alla fotocamera per scansionare le carte Pokémon.
          </Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnTxt}>Consenti</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  CAMERA
  // ═══════════════════════════════════════════════════════════════

  if (phase === 'idle' || phase === 'scanning') {
    return (
      <View style={s.fill}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
        <CameraOverlay scanning={phase === 'scanning'} />

        <SafeAreaView style={s.camUI}>
          <View style={s.header}>
            <Text style={s.logo}>PokéScanner</Text>
          </View>

          <View style={s.bottom}>
            <TouchableOpacity
              style={s.scanBtn}
              onPress={captureAndCrop}
              disabled={phase === 'scanning'}
            >
              <View
                style={[
                  s.scanInner,
                  phase === 'scanning' && { backgroundColor: '#FF4444' },
                ]}
              />
            </TouchableOpacity>
            <Text style={s.scanHint}>
              {phase === 'scanning'
                ? 'Acquisizione...'
                : 'Tocca per scansionare'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  RICONOSCIMENTO AUTOMATICO IN CORSO
  // ═══════════════════════════════════════════════════════════════

  if (phase === 'recognizing') {
    return (
      <SafeAreaView style={s.darkBg}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.title}>Analisi in corso...</Text>

          {croppedUri && (
            <View style={s.previewWrap}>
              <Image
                source={{ uri: croppedUri }}
                style={{
                  width: PREVIEW_W,
                  height: PREVIEW_H,
                  borderRadius: 12,
                }}
                contentFit="contain"
              />
            </View>
          )}

          <ActivityIndicator
            size="large"
            color="#4ECDC4"
            style={{ marginBottom: 16 }}
          />
          <Text style={s.loadTxt}>{statusMsg || 'Riconoscimento...'}</Text>
          <Text style={s.loadSub}>
            Potrebbe volerci fino a 30 secondi...
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  PREVIEW + RICERCA MANUALE (fallback se OCR non trova)
  // ═══════════════════════════════════════════════════════════════

  if (phase === 'preview') {
    return (
      <SafeAreaView style={s.darkBg}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.title}>Riconoscimento fallito</Text>
            <Text style={s.subtitle}>
              Scrivi il nome che vedi sulla carta per cercarla manualmente
            </Text>

            {croppedUri && (
              <View style={s.previewWrap}>
                <Image
                  source={{ uri: croppedUri }}
                  style={{
                    width: PREVIEW_W,
                    height: PREVIEW_H,
                    borderRadius: 12,
                  }}
                  contentFit="contain"
                />
              </View>
            )}

            {/* Ricerca manuale per nome */}
            <View style={s.searchBox}>
              <TextInput
                style={s.searchInput}
                placeholder="Nome carta (es. Pikachu, Charizard...)"
                placeholderTextColor="#666"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
                <Text style={s.searchBtnTxt}>Cerca</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.retryBtn} onPress={reset}>
              <Text style={s.retryTxt}>Scansiona di nuovo</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  SEARCHING (ricerca manuale in corso)
  // ═══════════════════════════════════════════════════════════════

  if (phase === 'searching') {
    return (
      <SafeAreaView style={s.darkBg}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={s.loadTxt}>
            Cerco &ldquo;{cardName}&rdquo;...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  RESULT
  // ═══════════════════════════════════════════════════════════════

  if (phase === 'result' && result) {
    return (
      <SafeAreaView style={s.darkBg}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.title}>Carta Trovata!</Text>

          {/* Immagine ufficiale dalla Pokémon TCG API */}
          {result.imageUrl ? (
            <View style={s.previewWrap}>
              <Image
                source={{ uri: result.imageUrl }}
                style={{ width: PREVIEW_W, height: PREVIEW_H, borderRadius: 12 }}
                contentFit="contain"
              />
            </View>
          ) : croppedUri ? (
            <View style={s.previewWrap}>
              <Image
                source={{ uri: croppedUri }}
                style={{ width: PREVIEW_W * 0.85, height: PREVIEW_H * 0.85, borderRadius: 12 }}
                contentFit="contain"
              />
            </View>
          ) : null}

          {/* Info carta */}
          <View style={s.infoBox}>
            <InfoRow label="Nome" value={result.name} />
            <InfoRow label="Set" value={result.set} />
            <InfoRow label="Numero" value={result.number} />
            {result.rarity && <InfoRow label="Rarita'" value={result.rarity} />}
            {result.hp && <InfoRow label="HP" value={result.hp} />}
            {result.types && result.types.length > 0 && (
              <InfoRow label="Tipo" value={result.types.join(', ')} />
            )}
            {result.setCode && <InfoRow label="Codice Set" value={result.setCode} />}
            {result.regulationMark && <InfoRow label="Reg. Mark" value={result.regulationMark} />}
            {result.language && <InfoRow label="Lingua" value={result.language.toUpperCase()} />}
          </View>

          {/* Valore economico */}
          {result.pricing && (result.pricing.avg !== null || result.pricing.low !== null) && (
            <View style={s.priceBox}>
              <Text style={s.priceTitle}>Valore di Mercato (Cardmarket)</Text>
              <View style={s.priceRow}>
                {result.pricing.avg !== null && (
                  <View style={s.priceItem}>
                    <Text style={s.priceValue}>
                      {result.pricing.avg.toFixed(2)} EUR
                    </Text>
                    <Text style={s.priceLabel}>Media</Text>
                  </View>
                )}
                {result.pricing.trend !== null && (
                  <View style={s.priceItem}>
                    <Text style={s.priceValue}>
                      {result.pricing.trend.toFixed(2)} EUR
                    </Text>
                    <Text style={s.priceLabel}>Trend</Text>
                  </View>
                )}
                {result.pricing.low !== null && (
                  <View style={s.priceItem}>
                    <Text style={s.priceValue}>
                      {result.pricing.low.toFixed(2)} EUR
                    </Text>
                    <Text style={s.priceLabel}>Minimo</Text>
                  </View>
                )}
              </View>
              {result.pricing.avgHolo !== null && result.pricing.avgHolo > 0 && (
                <View style={s.priceRow}>
                  <View style={s.priceItem}>
                    <Text style={s.priceValue}>
                      {result.pricing.avgHolo.toFixed(2)} EUR
                    </Text>
                    <Text style={s.priceLabel}>Media Holo</Text>
                  </View>
                </View>
              )}
              {result.pricing.updated && (
                <Text style={s.priceUpdated}>
                  Aggiornato: {new Date(result.pricing.updated).toLocaleDateString('it-IT')}
                </Text>
              )}
            </View>
          )}

          <ConfidenceBar confidence={result.confidence} label="Match" />

          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnOutline} onPress={() => setPhase('preview')}>
              <Text style={s.btnOutlineTxt}>Cerca Altro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnConfirm} onPress={handleConfirm}>
              <Text style={s.btnConfirmTxt}>✓ Salva</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.retryBtn} onPress={reset}>
            <Text style={s.retryTxt}>↻ Nuova scansione</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ── Helper ──────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  darkBg: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 24, paddingBottom: 60 },

  // Camera
  camUI: { flex: 1, justifyContent: 'space-between' },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  logo: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },

  bottom: { alignItems: 'center', paddingBottom: 24 },
  scanBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  scanInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 12, fontWeight: '500' },

  // Permission
  permWrap: { flex: 1, backgroundColor: '#0D0D1A', justifyContent: 'center', alignItems: 'center' },
  permCard: { alignItems: 'center', padding: 32 },
  permEmoji: { fontSize: 56, marginBottom: 16 },
  permTitle: { color: '#FFF', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  permBody: { color: '#AAA', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permBtn: { backgroundColor: '#FF4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  permBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Preview / Result
  title: { color: '#FFF', fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  previewWrap: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },

  // Search
  searchBox: { width: '100%', marginBottom: 16 },
  searchInput: {
    height: 50, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, color: '#FFF', fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 12,
  },
  searchBtn: {
    height: 50, backgroundColor: '#4ECDC4',
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  searchBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  retryBtn: { marginTop: 16, paddingVertical: 10 },
  retryTxt: { color: '#888', fontSize: 14, fontWeight: '500' },

  // Info box
  infoBox: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 16, marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  infoLabel: { color: '#888', fontSize: 14, fontWeight: '500' },
  infoValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Price box
  priceBox: {
    width: '100%', backgroundColor: 'rgba(78,205,196,0.08)',
    borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 4,
    borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)',
  },
  priceTitle: {
    color: '#4ECDC4', fontSize: 14, fontWeight: '700',
    marginBottom: 12, textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8,
  },
  priceItem: { alignItems: 'center', minWidth: 80 },
  priceValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  priceLabel: { color: '#888', fontSize: 11, fontWeight: '500', marginTop: 2 },
  priceUpdated: {
    color: '#555', fontSize: 10, textAlign: 'center', marginTop: 8,
  },

  loadTxt: { color: '#AAA', fontSize: 15, marginTop: 16 },
  loadSub: { color: '#666', fontSize: 13, marginTop: 6 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 14, marginTop: 24, width: '100%' },
  btnOutline: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center',
  },
  btnOutlineTxt: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  btnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    backgroundColor: '#2ECC71', alignItems: 'center',
  },
  btnConfirmTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
