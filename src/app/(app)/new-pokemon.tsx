import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getPokemons } from '@/integration/pokemonIntegration';
import { getColor, Colors, FIREWORK_COLORS } from '@/constants/colors';
import { TYPE_MAP, TYPE_ICONS } from '@/constants/pokemon';
import type { Pokemon, Poder } from '@types/pokemon';
import { PokeballLoading } from '@/components/pokeball-loading';

const PARTICLE_COUNT = 30;
const { width: SW, height: SH } = Dimensions.get('window');

const STAT_ABBR: Record<string, string> = {
  hp: 'HP', 
  attack: 'ATK', 
  defense: 'DEF',
  'special-attack': 'SP.A', 
  'special-defense': 'SP.D', 
  speed: 'SPD',
};

type Phase = 'loading' | 'reveal' | 'done';

interface ParticleConfig {
  tx: Animated.Value;
  ty: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  targetX: number;
  targetY: number;
}

function buildParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const distance = 100 + Math.random() * 140;
    return {
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      color: FIREWORK_COLORS[i % FIREWORK_COLORS.length],
      size: 5 + Math.random() * 7,
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance,
    };
  });
}

export default function NewPokemonScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  const cardScale = useRef(new Animated.Value(0)).current;
  const cardSpin = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.05)).current;

  const particlesRef = useRef<ParticleConfig[]>(buildParticles());
  const particlesRef2 = useRef<ParticleConfig[]>(buildParticles());

  useEffect(() => {
    async function fetchPokemon() {
      try {
        const all = await getPokemons(151);
        const random = all[Math.floor(Math.random() * all.length)];
        setPokemon(random);
        startReveal(random);
      } catch {
        router.back();
      }
    }
    fetchPokemon();
  }, []);

  function fireParticles(particles: ParticleConfig[]) {
    Animated.parallel(
      particles.flatMap(p => [
        Animated.timing(p.tx, { toValue: p.targetX, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.ty, { toValue: p.targetY, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.spring(p.scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ])
    ).start();
  }

  function resetParticles(particles: ParticleConfig[]) {
    particles.forEach(p => {
      p.tx.setValue(0);
      p.ty.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);
    });
  }

  function startReveal(poke: Pokemon) {
    setPhase('reveal');

    resetParticles(particlesRef.current);
    resetParticles(particlesRef2.current);

    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(cardSpin, { toValue: 2, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setPhase('done');
      Animated.sequence([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });

    fireParticles(particlesRef.current);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.18, duration: 900, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.05, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      resetParticles(particlesRef2.current);
      fireParticles(particlesRef2.current);
    }, 1400);
  }

  const spinInterpolate = cardSpin.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg'],
  });

  if (phase === 'loading' || !pokemon) {
    return (
      <View style={styles.loadingScreen}>
        <PokeballLoading />
        <Text style={styles.loadingText}>Buscando seu Pokémon...</Text>
      </View>
    );
  }

  const ptTypes = pokemon.tipos.map(t => TYPE_MAP[t] ?? 'normal');
  const colors = getColor(ptTypes);
  const hpStat = pokemon.poderes.find(p => p.nome === 'hp');
  const hp = hpStat?.forca ?? 0;

  return (
    <View style={[styles.screen, { backgroundColor: Colors.surfaceDeep }]}>
      <Animated.View
        style={[
          styles.bgGlow,
          { backgroundColor: colors.accent, opacity: glowPulse },
        ]}
      />

      <View style={styles.particleContainer} pointerEvents="none">
        {particlesRef.current.map((p, i) => (
          <Animated.View
            key={`p1-${i}`}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.tx },
                  { translateY: p.ty },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.particleContainer} pointerEvents="none">
        {particlesRef2.current.map((p, i) => (
          <Animated.View
            key={`p2-${i}`}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.tx },
                  { translateY: p.ty },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        ))}
      </View>

      <Animated.Text style={[styles.newPokeTitle, { opacity: titleOpacity }]}>
        NOVO POKÉMON!
      </Animated.Text>

      <Animated.View
        style={[
          styles.cardOuter,
          {
            borderColor: colors.accent,
            shadowColor: colors.accent,
            transform: [{ scale: cardScale }, { rotate: spinInterpolate }],
          },
        ]}
      >
        <View style={[styles.shimmerStrip, { backgroundColor: colors.accent + '20' }]} />
        <View style={[styles.cardInner, { backgroundColor: colors.bg }]}>

          <View style={[styles.topBar, { backgroundColor: colors.accent + '22', borderBottomColor: colors.accent + '55' }]}>
            <Text style={styles.pokeName} numberOfLines={1}>
              {pokemon.nome}
            </Text>
            <View style={styles.hpRow}>
              <Text style={styles.hpLabel}>HP</Text>
              <Text style={[styles.hpValue, { color: colors.accent }]}>{hp}</Text>
            </View>
          </View>

          <View style={[styles.imageWrapper, { borderColor: colors.accent + '33', backgroundColor: colors.accent + '0A' }]}>
            <View style={[styles.cornerTL, { borderColor: colors.accent + '55' }]} />
            <View style={[styles.cornerBR, { borderColor: colors.accent + '55' }]} />
            <Image
              source={{ uri: pokemon.imagem }}
              style={styles.pokeImage}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.footerRow, { borderTopColor: colors.accent + '33' }]}>
            <View style={styles.typesRow}>
              {ptTypes.map(t => (
                <View key={t} style={[styles.typePill, { backgroundColor: colors.accent + '25', borderColor: colors.accent + '55' }]}>
                  <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                  <Text style={[styles.typeLabel, { color: colors.accent }]}>{t}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.indexNum, { color: colors.accent + 'BB' }]}>#{pokemon.index}</Text>
          </View>

          <View style={[styles.statsSection, { borderTopColor: colors.accent + '22' }]}>
            {pokemon.poderes.map((poder: Poder) => (
              <View key={poder.nome} style={styles.statRow}>
                <Text style={styles.statName}>
                  {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 4).toUpperCase()}
                </Text>
                <View style={styles.statBarBg}>
                  <View style={[styles.statBarFill, {
                    width: `${Math.min((poder.forca / 150) * 100, 100)}%` as any,
                    backgroundColor: colors.accent,
                  }]} />
                </View>
                <Text style={[styles.statVal, { color: colors.accent }]}>{poder.forca}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.glowRing, { borderColor: colors.accent + '30' }]} />
      </Animated.View>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Incrível! Você capturou{'\n'}
        <Text style={[styles.subtitleName, { color: colors.accent }]}>
          {pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)}
        </Text>
        !
      </Animated.Text>

      <Animated.View style={{ opacity: btnOpacity }}>
        <TouchableOpacity
          style={[styles.btn, { borderColor: colors.accent }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, { color: colors.accent }]}>CONTINUAR</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.surfaceDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.whiteAlpha['40'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 24,
    textTransform: 'uppercase',
  },

  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  bgGlow: {
    position: 'absolute',
    width: SW * 1.4,
    height: SH * 0.6,
    borderRadius: SW,
    top: SH * 0.15,
    ...(Platform.OS !== 'web'
      ? {}
      : { filter: 'blur(80px)' } as any),
    opacity: 0.08,
  },

  particleContainer: {
    position: 'absolute',
    width: SW,
    height: SH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },

  newPokeTitle: {
    color: Colors.white,
    fontSize: Platform.OS === 'web' ? 18 : 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 28,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? { fontFamily: "'Press Start 2P', monospace" }
      : {}),
  },

  cardOuter: {
    width: Platform.OS === 'web' ? 260 : 220,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.7, shadowRadius: 16, elevation: 12 }
      : { boxShadow: '0 6px 30px rgba(0,0,0,0.8)' } as any),
  },

  shimmerStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 0,
  },

  cardInner: {
    borderRadius: 14,
    overflow: 'hidden',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  pokeName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
    textTransform: 'capitalize',
  },
  hpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  hpLabel: { color: Colors.whiteAlpha['50'], fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hpValue: { fontSize: 18, fontWeight: '900' },

  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Platform.OS === 'web' ? 160 : 130,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute', top: 6, left: 6,
    width: 14, height: 14,
    borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 2,
  },
  cornerBR: {
    position: 'absolute', bottom: 6, right: 6,
    width: 14, height: 14,
    borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 2,
  },
  pokeImage: {
    width: Platform.OS === 'web' ? 130 : 110,
    height: Platform.OS === 'web' ? 130 : 110,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  typesRow: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  typeEmoji: { fontSize: 10 },
  typeLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  indexNum: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  statsSection: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statName: { color: Colors.whiteAlpha['35'], fontSize: 10, fontWeight: '800', letterSpacing: 0.8, width: 36 },
  statBarBg: { flex: 1, height: 6, backgroundColor: Colors.whiteAlpha['08'], borderRadius: 3, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 3, opacity: 0.85 },
  statVal: { fontSize: 9, fontWeight: '700', width: 24, textAlign: 'right' },

  glowRing: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 18, borderWidth: 1,
    pointerEvents: 'none' as any,
  },

  subtitle: {
    color: Colors.whiteAlpha['65'],
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 22,
  },
  subtitleName: {
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'capitalize',
  },

  btn: {
    marginTop: 20,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 36,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
