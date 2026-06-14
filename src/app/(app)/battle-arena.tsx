import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, getColor } from '@/constants/colors';
import { TYPE_MAP, TYPE_ICONS, STAT_ABBR } from '@/constants/pokemon';
import { useBattle, BattlePokemon, RoundResult } from '@/context/BattleContext';

const isWeb = Platform.OS === 'web';
const WIN_THRESHOLD = 3;
const ROULETTE_INTERVAL_MS = 180;

function getPokemonImage(p: BattlePokemon): string {
  return p.image ?? p.imageUrl ?? '';
}

function getPokemonTypes(p: BattlePokemon): string[] {
  if (!p.types?.length) return ['normal'];
  return p.types.map(t => TYPE_MAP[t] ?? t);
}

function getAbilities(p: BattlePokemon): Array<{ name: string; strength: number }> {
  if (p.abilities?.length) return p.abilities;
  if (p.attributes) return Object.entries(p.attributes).map(([name, strength]) => ({ name, strength }));
  return [];
}

export default function BattleArena() {
  const {
    myUsername,
    opponentUsername,
    myTeam,
    opponentTeam,
    currentRound,
    myWins,
    opponentWins,
    rounds,
    status,
    isConnected,
    opponentDisconnected,
  } = useBattle();

  const [rouletteIdx, setRouletteIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const rouletteRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevRoundsLen = useRef(0);

  const lastRound = rounds[rounds.length - 1] as RoundResult | undefined;
  const isDecided = myWins >= WIN_THRESHOLD || opponentWins >= WIN_THRESHOLD;

  // Prevent hardware back
  useEffect(() => {
    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }
  }, []);

  // Start roulette on mount — first round hasn't arrived yet
  useEffect(() => {
    startRoulette();
    return () => stopRoulette();
  }, []);

  // React to new round results
  useEffect(() => {
    if (rounds.length === 0 || rounds.length === prevRoundsLen.current) return;
    prevRoundsLen.current = rounds.length;

    // Stop roulette, show result
    stopRoulette();

    // Flash animation — ao terminar já inicia a roleta do próximo round
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (!isDecided) startRoulette();
    });
  }, [rounds.length, isDecided]);

  function startRoulette() {
    setIsSpinning(true);
    if (rouletteRef.current) clearInterval(rouletteRef.current);
    let counter = 0;
    rouletteRef.current = setInterval(() => {
      counter += 1;
      setRouletteIdx(counter);
    }, ROULETTE_INTERVAL_MS);
  }

  function stopRoulette() {
    setIsSpinning(false);
    if (rouletteRef.current) {
      clearInterval(rouletteRef.current);
      rouletteRef.current = null;
    }
  }

  // Derive "my" and "opponent" player results from the last round
  const myPlayerResult = lastRound
    ? (lastRound.player1.username === myUsername ? lastRound.player1 : lastRound.player2)
    : null;
  const oppPlayerResult = lastRound
    ? (lastRound.player1.username === myUsername ? lastRound.player2 : lastRound.player1)
    : null;

  // Durante o spinning mostra o PRÓXIMO Pokémon (índice = rounds já concluídos)
  // Durante o resultado mostra o Pokémon que acabou de lutar
  const nextIdx = Math.min(rounds.length, myTeam.length - 1);
  const nextOppIdx = Math.min(rounds.length, opponentTeam.length - 1);

  const myCurrentPokemon = isSpinning
    ? myTeam[nextIdx]
    : (myPlayerResult?.pokemon ? (myTeam.find(p => p.name === myPlayerResult.pokemon) ?? myTeam[0]) : myTeam[0]);
  const oppCurrentPokemon = isSpinning
    ? opponentTeam[nextOppIdx]
    : (oppPlayerResult?.pokemon ? (opponentTeam.find(p => p.name === oppPlayerResult.pokemon) ?? opponentTeam[0]) : opponentTeam[0]);

  const myCurrentName = isSpinning ? myCurrentPokemon?.name : myPlayerResult?.pokemon;
  const oppCurrentName = isSpinning ? oppCurrentPokemon?.name : oppPlayerResult?.pokemon;

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderTeamCard = (
    p: BattlePokemon,
    idx: number,
    isOpponent: boolean,
    currentName: string | undefined,
  ) => {
    const types = getPokemonTypes(p);
    const color = getColor(types);
    const isActive = p.name === currentName;

    return (
      <View
        key={`${isOpponent ? 'opp' : 'my'}-${p.name}-${idx}`}
        style={[
          styles.teamCard,
          { borderColor: isActive ? Colors.btnPrimary : color.accent + '55', backgroundColor: isActive ? Colors.btnPrimary + '15' : color.bg },
          isActive && styles.teamCardActive,
          Platform.OS !== 'web' ? { shadowColor: isActive ? Colors.btnPrimary : color.accent } : {},
        ]}
      >
        {getPokemonImage(p) ? (
          <Image source={{ uri: getPokemonImage(p) }} style={styles.teamCardImage} resizeMode="contain" />
        ) : (
          <View style={[styles.teamCardImage, { backgroundColor: color.accent + '20' }]} />
        )}
        <Text style={[styles.teamCardName, { color: isActive ? Colors.btnPrimary : Colors.whiteAlpha['45'] }]} numberOfLines={1}>
          {p.name}
        </Text>
        {isActive && (
          <View style={[styles.teamBadge, { backgroundColor: Colors.btnPrimary + '25' }]}>
            <Text style={[styles.teamBadgeText, { color: Colors.btnPrimary }]}>VS</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMainCard = (
    p: BattlePokemon,
    isOpponent: boolean,
    playerResult: typeof myPlayerResult,
  ) => {
    const types = getPokemonTypes(p);
    const color = getColor(types);
    const abilities = getAbilities(p);

    const won = playerResult?.won ?? null;
    const selectedAttr = playerResult?.attribute ?? null;
    const selectedValue = playerResult?.strength ?? null;

    const borderColor =
      won === true ? Colors.game.win :
      won === false ? Colors.game.loss :
      color.accent;

    // Roulette: which ability row is highlighted while spinning
    const rouletteAbilityIdx = isSpinning && abilities.length > 0
      ? rouletteIdx % abilities.length
      : null;

    return (
      <View style={[styles.mainCard, { borderColor, ...(Platform.OS !== 'web' ? { shadowColor: borderColor } : {}) }]}>
        {/* Header */}
        <View style={[styles.mainCardHeader, { backgroundColor: color.accent + '20', borderBottomColor: color.accent + '40' }]}>
          {isOpponent && (
            <Text style={[styles.mainCardTag, { color: Colors.game.loss + 'BB' }]}>ADV</Text>
          )}
          <Text style={[styles.mainCardName, { color: Colors.white }]} numberOfLines={1}>
            {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
          </Text>
        </View>

        {/* Image */}
        <View style={[styles.mainCardImageWrap, { borderColor: color.accent + '30', backgroundColor: color.accent + '08' }]}>
          {getPokemonImage(p) ? (
            <Image source={{ uri: getPokemonImage(p) }} style={styles.mainCardImage} resizeMode="contain" />
          ) : (
            <View style={styles.mainCardImage} />
          )}
        </View>

        {/* Types */}
        <View style={[styles.mainCardTypesRow, { borderTopColor: color.accent + '22' }]}>
          {types.map(t => (
            <View key={t} style={[styles.mainCardTypePill, { backgroundColor: color.accent + '25', borderColor: color.accent + '55' }]}>
              <Text style={styles.mainCardTypeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
              <Text style={[styles.mainCardTypeLabel, { color: color.accent }]}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Abilities — roulette while spinning, result when done */}
        {abilities.length > 0 && (
          <View style={[styles.mainCardAbilities, { borderTopColor: color.accent + '22' }]}>
            {abilities.map((ab, abIdx) => {
              const isResult = !isSpinning && ab.name === selectedAttr;
              const isRoulette = isSpinning && abIdx === rouletteAbilityIdx;
              const isHighlighted = isResult || isRoulette;

              const highlightColor = isResult
                ? (won === true ? Colors.game.win : won === false ? Colors.game.loss : color.accent)
                : color.accent;

              return (
                <Animated.View
                  key={ab.name}
                  style={[
                    styles.mainCardAbilityRow,
                    isHighlighted && {
                      backgroundColor: highlightColor + '22',
                      borderColor: highlightColor + '70',
                    },
                    isRoulette && { opacity: flashAnim.interpolate
                      ? undefined // avoid re-interpolating outside sequence
                      : 1 },
                  ]}
                >
                  <Text style={[styles.mainCardAbilityLabel, { color: isHighlighted ? highlightColor : Colors.whiteAlpha['35'] }]}>
                    {STAT_ABBR[ab.name] ?? ab.name.slice(0, 4).toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.mainCardAbilityValue,
                    { color: isHighlighted ? highlightColor : Colors.whiteAlpha['55'], fontWeight: isHighlighted ? '900' : '700' },
                  ]}>
                    {isResult && selectedValue != null ? selectedValue : ab.strength}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      {/* Banners */}
      {!isConnected && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.reconnectText}>RECONECTANDO...</Text>
        </View>
      )}
      {opponentDisconnected && (
        <View style={styles.disconnectBanner}>
          <Text style={styles.disconnectText}>⚠ {opponentUsername ?? 'Oponente'} desconectou</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score bar */}
        <View style={styles.scoreBar}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreNum, { color: Colors.game.win }]}>{myWins}</Text>
            <Text style={styles.scoreLabel}>VOCÊ</Text>
          </View>
          <View style={styles.scoreCenter}>
            <Text style={styles.scoreSep}>×</Text>
            <Text style={styles.roundLabel}>RODADA {currentRound || 1} / 5</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreNum, { color: Colors.game.loss }]}>{opponentWins}</Text>
            <Text style={styles.scoreLabel} numberOfLines={1}>{opponentUsername ?? 'ADV'}</Text>
          </View>
        </View>

        {/* Teams side-by-side */}
        {myTeam.length > 0 && (
          <View style={styles.teamsContainer}>
            <View style={styles.teamColumn}>
              <Text style={styles.teamLabel}>MEU TIME</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamRow}>
                {myTeam.map((p, i) => renderTeamCard(p, i, false, myCurrentName))}
              </ScrollView>
            </View>

            <Text style={styles.teamXSeparator}>X</Text>

            <View style={styles.teamColumn}>
              <Text style={[styles.teamLabel, { color: Colors.game.loss + '88', textAlign: 'right' }]}>ADVERSÁRIO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.teamRow, styles.teamRowRight]}>
                {opponentTeam.map((p, i) => renderTeamCard(p, i, true, oppCurrentName))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Main battle cards */}
        {(myCurrentPokemon || oppCurrentPokemon) && (
          <View style={styles.arenaArea}>
            <View style={styles.arenaRow}>
              {myCurrentPokemon && renderMainCard(myCurrentPokemon, false, isSpinning ? null : myPlayerResult)}
              <View style={styles.vsCenter}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              {oppCurrentPokemon && renderMainCard(oppCurrentPokemon, true, isSpinning ? null : oppPlayerResult)}
            </View>

            {/* Round result badge */}
            {lastRound && !isSpinning && (() => {
              const iWon = myPlayerResult?.won === true;
              return (
                <Animated.View
                  style={[
                    styles.resultBadge,
                    iWon ? styles.resultWin : styles.resultLose,
                    { opacity: flashAnim },
                  ]}
                >
                  <Text style={[styles.resultTitle, { color: iWon ? Colors.game.win : Colors.game.loss }]}>
                    {iWon ? '⚔ VITÓRIA!' : '💀 DERROTA!'}
                  </Text>
                  <Text style={styles.resultDetail}>
                    {STAT_ABBR[myPlayerResult?.attribute ?? ''] ?? myPlayerResult?.attribute?.toUpperCase()}
                    {'  '}
                    <Text style={{ color: iWon ? Colors.game.win : Colors.game.loss, fontWeight: '900' }}>
                      {myPlayerResult?.strength}
                    </Text>
                    {iWon ? ' > ' : ' < '}
                    <Text style={{ color: iWon ? Colors.game.loss : Colors.game.win, fontWeight: '900' }}>
                      {oppPlayerResult?.strength}
                    </Text>
                  </Text>
                </Animated.View>
              );
            })()}

            {/* Spinning indicator */}
            {isSpinning && (
              <View style={styles.waitingRound}>
                <Text style={styles.waitingRoundText}>SORTEANDO ATRIBUTO...</Text>
              </View>
            )}
          </View>
        )}

        {isDecided && status !== 'finished' && (
          <View style={styles.waitingResult}>
            <Text style={styles.waitingResultText}>AGUARDANDO RESULTADO FINAL...</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  reconnectBanner: {
    backgroundColor: Colors.semantic.warning.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.semantic.warning.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reconnectText: {
    color: Colors.semantic.warning.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  disconnectBanner: {
    backgroundColor: Colors.game.loss + '20',
    borderBottomWidth: 1,
    borderBottomColor: Colors.game.loss + '50',
    paddingVertical: 8,
    alignItems: 'center',
  },
  disconnectText: {
    color: Colors.game.loss,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  scrollContent: {
    paddingBottom: 32,
  },

  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.whiteAlpha['08'],
    marginTop: Platform.OS === 'ios' ? 52 : 16,
  },
  scoreItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 60,
  },
  scoreNum: {
    fontSize: isWeb ? 28 : 22,
    fontWeight: '900',
  },
  scoreLabel: {
    color: Colors.whiteAlpha['40'],
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    maxWidth: 70,
    textAlign: 'center',
  },
  scoreCenter: {
    alignItems: 'center',
    gap: 2,
  },
  scoreSep: {
    color: Colors.btnPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  roundLabel: {
    color: Colors.whiteAlpha['30'],
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    gap: 6,
  },
  teamColumn: {
    flex: 1,
    gap: 6,
  },
  teamXSeparator: {
    color: Colors.btnPrimary,
    fontSize: isWeb ? 12 : 11,
    fontWeight: '900',
    letterSpacing: 2,
    paddingTop: 2,
  },
  teamLabel: {
    color: Colors.whiteAlpha['35'],
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
  },
  teamRow: {
    gap: 8,
    paddingBottom: 4,
  },
  teamRowRight: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  teamCard: {
    width: isWeb ? 80 : 68,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 3,
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 }
      : {}),
  },
  teamCardActive: {
    ...(Platform.OS !== 'web'
      ? { shadowOpacity: 0.7, shadowRadius: 10, elevation: 8 }
      : {}),
  },
  teamCardImage: {
    width: isWeb ? 44 : 36,
    height: isWeb ? 44 : 36,
  },
  teamCardName: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  teamBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  teamBadgeText: {
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 1,
  },

  arenaArea: {
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 12,
  },
  arenaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  vsCenter: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  vsText: {
    color: Colors.btnPrimary,
    fontSize: isWeb ? 12 : 11,
    fontWeight: '900',
  },
  mainCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
      : ({ boxShadow: '0 4px 16px rgba(0,0,0,0.6)' } as any)),
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  mainCardTag: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainCardName: {
    fontSize: isWeb ? 10 : 9,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
    flex: 1,
  },
  mainCardImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: isWeb ? 90 : 72,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  mainCardImage: {
    width: isWeb ? 70 : 58,
    height: isWeb ? 70 : 58,
  },
  mainCardTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  mainCardTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  mainCardTypeEmoji: {
    fontSize: 9,
  },
  mainCardTypeLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  mainCardAbilities: {
    borderTopWidth: 1,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 2,
  },
  mainCardAbilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mainCardAbilityLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainCardAbilityValue: {
    fontSize: isWeb ? 11 : 10,
    textAlign: 'right',
  },

  resultBadge: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 }
      : {}),
  },
  resultWin: {
    backgroundColor: Colors.game.win + '15',
    borderColor: Colors.game.win + '60',
    ...(Platform.OS !== 'web'
      ? { shadowColor: Colors.game.win }
      : ({ boxShadow: '0 4px 16px rgba(74,222,128,0.3)' } as any)),
  },
  resultLose: {
    backgroundColor: Colors.game.loss + '15',
    borderColor: Colors.game.loss + '60',
    ...(Platform.OS !== 'web'
      ? { shadowColor: Colors.game.loss }
      : ({ boxShadow: '0 4px 16px rgba(248,113,113,0.3)' } as any)),
  },
  resultTitle: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  resultDetail: {
    color: Colors.whiteAlpha['55'],
    fontSize: isWeb ? 11 : 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  waitingRound: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.btnPrimary + '12',
    borderWidth: 1,
    borderColor: Colors.btnPrimary + '30',
  },
  waitingRoundText: {
    color: Colors.btnPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  waitingResult: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  waitingResultText: {
    color: Colors.whiteAlpha['35'],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  bottomSpacer: { height: 20 },
});
