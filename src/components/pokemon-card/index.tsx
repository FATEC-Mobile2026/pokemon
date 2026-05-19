import React from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import type { Pokemon } from '@types/pokemon';
import { TYPE_MAP, TYPE_ICONS } from '@/constants/pokemon';
import { getColor, Colors } from '@/constants/colors';

type Size = 'large' | 'mini';

interface PokemonCardProps {
  pokemon: Pokemon;
  size?: Size;
}

export function PokemonCard({ pokemon, size = 'large' }: PokemonCardProps) {
  const ptTypes = pokemon.tipos.map(t => TYPE_MAP[t] ?? 'normal');
  const color = getColor(ptTypes);
  const isMini = size === 'mini';
  const hp = pokemon.poderes.find(p => p.nome === 'hp')?.forca ?? 0;
  const displayName = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1);

  return (
    <View style={[
      styles.outerFrame,
      isMini ? styles.outerFrameMini : styles.outerFrameLarge,
      { borderColor: color.accent, shadowColor: color.accent },
    ]}>
      <View style={[styles.shimmerStrip, { backgroundColor: color.accent + '18' }]} />

      <View style={[styles.innerCard, { backgroundColor: color.bg }]}>

        {/* TOP BAR */}
        <View style={[styles.topBar, { backgroundColor: color.accent + '22', borderBottomColor: color.accent + '55' }]}>
          <Text
            style={[styles.pokeName, isMini ? styles.pokeNameMini : styles.pokeNameLarge, { color: Colors.white }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {!isMini && (
            <View style={styles.hpRow}>
              <Text style={[styles.hpLabel, { color: Colors.whiteAlpha['50'] }]}>HP</Text>
              <Text style={[styles.hpValue, { color: color.accent }]}>{hp}</Text>
            </View>
          )}
        </View>

        {/* IMAGE */}
        <View style={[
          styles.imageWrapper,
          isMini ? styles.imageWrapperMini : styles.imageWrapperLarge,
          { borderColor: color.accent + '33', backgroundColor: color.accent + '0A' },
        ]}>
          {!isMini && <View style={[styles.cornerTL, { borderColor: color.accent + '55' }]} />}
          {!isMini && <View style={[styles.cornerBR, { borderColor: color.accent + '55' }]} />}
          <Image
            source={{ uri: pokemon.imagem }}
            style={isMini ? styles.imageMini : styles.imageLarge}
            resizeMode="contain"
          />
        </View>

        {/* FOOTER */}
        {isMini ? (
          <View style={[styles.footerMini, { borderTopColor: color.accent + '33' }]}>
            <Text style={[styles.numberMini, { color: color.accent + 'BB' }]}>#{pokemon.index}</Text>
            <View style={[styles.typePillMini, { backgroundColor: color.accent + '30' }]}>
              <Text style={styles.typeEmojiMini}>{TYPE_ICONS[ptTypes[0]] ?? '⭐'}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.footerLarge, { borderTopColor: color.accent + '33' }]}>
            <View style={styles.typesRow}>
              {ptTypes.map(t => (
                <View key={t} style={[styles.typePill, { backgroundColor: color.accent + '25', borderColor: color.accent + '55' }]}>
                  <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                  <Text style={[styles.typeLabel, { color: color.accent }]}>{t}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.numberLarge, { color: color.accent + 'BB' }]}>#{pokemon.index}</Text>
          </View>
        )}

        {!isMini && (
          <View style={[styles.statsRow, { borderTopColor: color.accent + '22' }]}>
            {pokemon.poderes.slice(0, 3).map(poder => (
              <React.Fragment key={poder.nome}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{poder.nome.slice(0, 4).toUpperCase()}</Text>
                  <Text style={[styles.statValue, { color: color.accent }]}>{poder.forca}</Text>
                </View>
                {pokemon.poderes.indexOf(poder) < 2 && (
                  <View style={[styles.statDivider, { backgroundColor: color.accent + '33' }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.glowRing, { borderColor: color.accent + '22' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
      : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' } as any),
  },
  outerFrameLarge: { width: 155, marginRight: 14 },
  outerFrameMini: { borderWidth: 1.5, borderRadius: 10, flex: 1, width: '100%', height: '100%' },

  shimmerStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%', zIndex: 0 },
  innerCard: { flex: 1, borderRadius: 12, overflow: 'hidden' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1,
  },
  pokeName: { fontWeight: '800', letterSpacing: 0.3, flex: 1 },
  pokeNameLarge: { fontSize: 13 },
  pokeNameMini: { fontSize: 7, textAlign: 'center' },

  hpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  hpLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hpValue: { fontSize: 16, fontWeight: '900' },

  imageWrapper: {
    alignItems: 'center', justifyContent: 'center',
    margin: 6, borderRadius: 8, borderWidth: 1, overflow: 'hidden',
  },
  imageWrapperLarge: { height: 110, marginHorizontal: 8, marginVertical: 6 },
  imageWrapperMini: { height: 44, margin: 4 },
  imageLarge: { width: 100, height: 100 },
  imageMini: { width: 38, height: 38 },

  cornerTL: {
    position: 'absolute', top: 4, left: 4,
    width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute', bottom: 4, right: 4,
    width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 2,
  },

  footerLarge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 5, borderTopWidth: 1,
  },
  footerMini: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 5, paddingBottom: 4, borderTopWidth: 1, marginTop: 2,
  },

  typesRow: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 20, borderWidth: 1,
  },
  typeEmoji: { fontSize: 9 },
  typeLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  typePillMini: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  typeEmojiMini: { fontSize: 9 },
  numberLarge: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  numberMini: { fontSize: 7, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 6, paddingHorizontal: 4, borderTopWidth: 1,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { color: Colors.whiteAlpha['35'], fontSize: 6, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  statValue: { fontSize: 8, fontWeight: '700' },
  statDivider: { width: 1, height: 20 },

  glowRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 16, borderWidth: 1, pointerEvents: 'none' as any,
  },
});
