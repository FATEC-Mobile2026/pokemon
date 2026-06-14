import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, Platform, ScrollView,
    Image, TouchableOpacity, Animated,
} from 'react-native';
import { Header } from '@/components/header';
import { Colors, getColor } from '@/constants/colors';
import { getTeam } from '@/integration/teamIntegration';
import { useDatabase } from '@/context/DatabaseContext';
import { useAuth } from '@/context/AuthContext';
import { Pokemon } from '@/@types/pokemon';
import { TYPE_MAP, STAT_ABBR } from '@/constants/pokemon';
import { PokeballLoading } from '@/components/pokeball-loading';

const isWeb = Platform.OS === 'web';

type BattleResult = 'pending' | 'win' | 'lose';
type BattlePhase = 'idle' | 'spinning' | 'result' | 'done';

const SPIN_DELAYS = [70, 70, 80, 90, 110, 140, 180, 230, 290, 370, 470, 620, 820];
const WIN_THRESHOLD = 3;

const OPPONENT_TEAM: Pokemon[] = [
    {
        index: '6',
        nome: 'charizard',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        tipos: ['fire', 'flying'],
        poderes: [
            { nome: 'hp', forca: 78 },
            { nome: 'attack', forca: 84 },
            { nome: 'defense', forca: 78 },
            { nome: 'special-attack', forca: 109 },
            { nome: 'special-defense', forca: 85 },
            { nome: 'speed', forca: 100 },
        ],
    },
    {
        index: '9',
        nome: 'blastoise',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
        tipos: ['water'],
        poderes: [
            { nome: 'hp', forca: 79 },
            { nome: 'attack', forca: 83 },
            { nome: 'defense', forca: 100 },
            { nome: 'special-attack', forca: 85 },
            { nome: 'special-defense', forca: 105 },
            { nome: 'speed', forca: 78 },
        ],
    },
    {
        index: '3',
        nome: 'venusaur',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
        tipos: ['grass', 'poison'],
        poderes: [
            { nome: 'hp', forca: 80 },
            { nome: 'attack', forca: 82 },
            { nome: 'defense', forca: 83 },
            { nome: 'special-attack', forca: 100 },
            { nome: 'special-defense', forca: 100 },
            { nome: 'speed', forca: 80 },
        ],
    },
    {
        index: '94',
        nome: 'gengar',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
        tipos: ['ghost', 'poison'],
        poderes: [
            { nome: 'hp', forca: 60 },
            { nome: 'attack', forca: 65 },
            { nome: 'defense', forca: 60 },
            { nome: 'special-attack', forca: 130 },
            { nome: 'special-defense', forca: 75 },
            { nome: 'speed', forca: 110 },
        ],
    },
    {
        index: '68',
        nome: 'machamp',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/68.png',
        tipos: ['fighting'],
        poderes: [
            { nome: 'hp', forca: 90 },
            { nome: 'attack', forca: 130 },
            { nome: 'defense', forca: 80 },
            { nome: 'special-attack', forca: 65 },
            { nome: 'special-defense', forca: 85 },
            { nome: 'speed', forca: 55 },
        ],
    },
    {
        index: '131',
        nome: 'lapras',
        imagem: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png',
        tipos: ['water', 'ice'],
        poderes: [
            { nome: 'hp', forca: 130 },
            { nome: 'attack', forca: 85 },
            { nome: 'defense', forca: 80 },
            { nome: 'special-attack', forca: 85 },
            { nome: 'special-defense', forca: 95 },
            { nome: 'speed', forca: 60 },
        ],
    },
];

export default function Battle() {
    const { userRepository } = useDatabase();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Pokemon[]>([]);
    const [phase, setPhase] = useState<BattlePhase>('idle');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [results, setResults] = useState<BattleResult[]>([]);
    const [spinAttrIdx, setSpinAttrIdx] = useState(0);
    const [finalAttrIdx, setFinalAttrIdx] = useState(-1);
    const [spinOpponentAttrIdx, setSpinOpponentAttrIdx] = useState(0);
    const [finalOpponentAttrIdx, setFinalOpponentAttrIdx] = useState(-1);
    const [currentOpponent, setCurrentOpponent] = useState<Pokemon>(OPPONENT_TEAM[0]);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    // always reflects the latest results without closure staleness
    const resultsRef = useRef<BattleResult[]>([]);
    resultsRef.current = results;

    useEffect(() => {
        async function load() {
            try {
                if (!user) return;
                const userId = await userRepository.getUserId(user);
                if (!userId) return;
                const { team: t } = await getTeam(userId);
                setTeam(t);
                setResults(new Array(t.length).fill('pending'));
            } catch (e) {
                console.error('Erro ao carregar time:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user, userRepository]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (phase === 'spinning') {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
        pulseAnim.setValue(1);
    }, [phase, spinAttrIdx]);

    const runBattle = (pokemon: Pokemon, index: number) => {
        const opponent = OPPONENT_TEAM[index % OPPONENT_TEAM.length];
        setCurrentOpponent(opponent);

        const attrCount = pokemon.poderes.length;
        const oppAttrCount = opponent.poderes.length;
        if (attrCount === 0 || oppAttrCount === 0) return;

        const targetIdx = Math.floor(Math.random() * attrCount);
        const targetOpponentIdx = Math.floor(Math.random() * oppAttrCount);
        let step = 0;
        let current = 0;
        let currentOpp = 0;

        setSpinAttrIdx(0);
        setSpinOpponentAttrIdx(0);
        setFinalAttrIdx(-1);
        setFinalOpponentAttrIdx(-1);

        const advance = () => {
            step++;
            if (step >= SPIN_DELAYS.length) {
                setSpinAttrIdx(targetIdx);
                setFinalAttrIdx(targetIdx);
                setSpinOpponentAttrIdx(targetOpponentIdx);
                setFinalOpponentAttrIdx(targetOpponentIdx);

                const myPower = pokemon.poderes[targetIdx];
                const oppPower = opponent.poderes[targetOpponentIdx];
                const won = myPower.forca > oppPower.forca;

                setResults(prev => {
                    const copy = [...prev];
                    copy[index] = won ? 'win' : 'lose';
                    return copy;
                });
                setPhase('result');

                flashAnim.setValue(0);
                Animated.sequence([
                    Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(flashAnim, { toValue: 0.6, duration: 200, useNativeDriver: true }),
                    Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.timing(flashAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
                    Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                ]).start();
                return;
            }
            current = (current + 1) % attrCount;
            currentOpp = (currentOpp + 1) % oppAttrCount;
            setSpinAttrIdx(current);
            setSpinOpponentAttrIdx(currentOpp);
            timeoutRef.current = setTimeout(advance, SPIN_DELAYS[step]);
        };

        timeoutRef.current = setTimeout(advance, SPIN_DELAYS[0]);
    };

    useEffect(() => {
        if (phase !== 'result') return;
        const capturedIdx = currentIdx;
        const capturedTeam = team;
        const timer = setTimeout(() => {
            const wins = resultsRef.current.filter(r => r === 'win').length;
            const losses = resultsRef.current.filter(r => r === 'lose').length;
            const nextIdx = capturedIdx + 1;

            if (nextIdx >= capturedTeam.length || wins >= WIN_THRESHOLD || losses >= WIN_THRESHOLD) {
                setPhase('done');
            } else {
                setCurrentIdx(nextIdx);
                setFinalAttrIdx(-1);
                setPhase('spinning');
                runBattle(capturedTeam[nextIdx], nextIdx);
            }
        }, 2400);
        return () => clearTimeout(timer);
    }, [phase]);

    const startBattle = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setCurrentIdx(0);
        setFinalAttrIdx(-1);
        setFinalOpponentAttrIdx(-1);
        setSpinAttrIdx(0);
        setSpinOpponentAttrIdx(0);
        setCurrentOpponent(OPPONENT_TEAM[0]);
        setResults(new Array(team.length).fill('pending'));
        setPhase('spinning');
        runBattle(team[0], 0);
    };

    const resetBattle = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setPhase('idle');
        setCurrentIdx(0);
        setFinalAttrIdx(-1);
        setFinalOpponentAttrIdx(-1);
        setSpinAttrIdx(0);
        setSpinOpponentAttrIdx(0);
        setCurrentOpponent(OPPONENT_TEAM[0]);
        setResults(new Array(team.length).fill('pending'));
    };

    if (loading) {
        return (
            <View style={styles.wrapper}>
                <Header />
                <PokeballLoading />
            </View>
        );
    }

    if (team.length === 0) {
        return (
            <View style={styles.wrapper}>
                <Header />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>SEM TIME</Text>
                    <Text style={styles.emptySubtitle}>Adicione Pokémons ao seu time para batalhar.</Text>
                </View>
            </View>
        );
    }

    const currentPokemon = team[currentIdx];
    const currentResult = results[currentIdx];

    const renderTeamCard = (pokemon: Pokemon, idx: number, isOpponentSide = false) => {
        const ptTypes = pokemon.tipos.map(t => TYPE_MAP[t] ?? 'normal');
        const color = getColor(ptTypes);

        let result: BattleResult = 'pending';
        let isActive = false;

        if (isOpponentSide) {
            // opponent result is inverse of player result
            const playerResult = results[idx];
            result = playerResult === 'win' ? 'lose' : playerResult === 'lose' ? 'win' : 'pending';
            isActive = idx === currentIdx && (phase === 'spinning' || phase === 'result');
        } else {
            result = results[idx];
            isActive = idx === currentIdx && (phase === 'spinning' || phase === 'result');
        }

        const borderColor =
            result === 'win' ? Colors.game.win :
            result === 'lose' ? Colors.game.loss :
            isActive ? Colors.btnPrimary :
            color.accent + '66';

        const bgTint =
            result === 'win' ? Colors.game.win + '18' :
            result === 'lose' ? Colors.game.loss + '18' :
            isActive ? Colors.btnPrimary + '15' :
            color.bg;

        return (
            <View
                key={`${isOpponentSide ? 'opp' : 'my'}-${pokemon.index}-${idx}`}
                style={[
                    styles.teamCard,
                    { borderColor, backgroundColor: bgTint },
                    isActive && styles.teamCardActive,
                    Platform.OS !== 'web' ? { shadowColor: borderColor } : {},
                ]}
            >
                <Image source={{ uri: pokemon.imagem }} style={styles.teamCardImage} resizeMode="contain" />
                <Text
                    style={[
                        styles.teamCardName,
                        result === 'win' ? { color: Colors.game.win } :
                        result === 'lose' ? { color: Colors.game.loss } :
                        isActive ? { color: Colors.btnPrimary } :
                        { color: Colors.whiteAlpha['45'] },
                    ]}
                    numberOfLines={1}
                >
                    {pokemon.nome}
                </Text>
                {result === 'win' && (
                    <View style={[styles.teamBadge, { backgroundColor: Colors.game.win + '25' }]}>
                        <Text style={[styles.teamBadgeText, { color: Colors.game.win }]}>WIN</Text>
                    </View>
                )}
                {result === 'lose' && (
                    <View style={[styles.teamBadge, { backgroundColor: Colors.game.loss + '25' }]}>
                        <Text style={[styles.teamBadgeText, { color: Colors.game.loss }]}>LOSE</Text>
                    </View>
                )}
                {isActive && result === 'pending' && (
                    <View style={[styles.teamBadge, { backgroundColor: Colors.btnPrimary + '25' }]}>
                        <Text style={[styles.teamBadgeText, { color: Colors.btnPrimary }]}>VS</Text>
                    </View>
                )}
            </View>
        );
    };

    // Compact side-by-side battle card
    const renderBattleCard = (pokemon: Pokemon, isOpponent: boolean) => {
        const ptTypes = pokemon.tipos.map(t => TYPE_MAP[t] ?? 'normal');
        const color = getColor(ptTypes);

        const effectiveSpinIdx = isOpponent ? spinOpponentAttrIdx : spinAttrIdx;
        const effectiveFinalIdx = isOpponent ? finalOpponentAttrIdx : finalAttrIdx;

        return (
            <View style={[styles.compactCard, { borderColor: color.accent, ...(Platform.OS !== 'web' ? { shadowColor: color.accent } : {}) }]}>
                <View style={[styles.compactCardHeader, { backgroundColor: color.accent + '20', borderBottomColor: color.accent + '40' }]}>
                    {isOpponent && (
                        <Text style={[styles.compactCardTag, { color: Colors.game.loss + 'BB' }]}>ADV</Text>
                    )}
                    <Text style={[styles.compactPokeName, { color: Colors.white }]} numberOfLines={1}>
                        {pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)}
                    </Text>
                    <Text style={[styles.compactPokeIndex, { color: color.accent + 'BB' }]}>#{pokemon.index}</Text>
                </View>

                <View style={[styles.compactImageWrapper, { borderColor: color.accent + '30', backgroundColor: color.accent + '08' }]}>
                    <Image source={{ uri: pokemon.imagem }} style={styles.compactImage} resizeMode="contain" />
                </View>

                <View style={[styles.compactAttrs, { borderTopColor: color.accent + '20' }]}>
                    {pokemon.poderes.map((poder, idx) => {
                        const isSpinning = (phase === 'spinning' || phase === 'result') && idx === effectiveSpinIdx;
                        const isFinal = phase === 'result' && idx === effectiveFinalIdx;

                        // player: win if my > opp; opponent: "win" display if opp > mine (i.e., player lost)
                        const isWin = isFinal && (isOpponent ? currentResult === 'lose' : currentResult === 'win');
                        const isLose = isFinal && (isOpponent ? currentResult === 'win' : currentResult === 'lose');

                        const rowBg =
                            isWin ? Colors.game.win + '18' :
                            isLose ? Colors.game.loss + '18' :
                            isSpinning ? color.accent + '20' :
                            'transparent';

                        const rowBorder =
                            isWin ? Colors.game.win :
                            isLose ? Colors.game.loss :
                            isSpinning ? color.accent :
                            'transparent';

                        const labelColor =
                            isWin ? Colors.game.win :
                            isLose ? Colors.game.loss :
                            isSpinning ? color.accent :
                            Colors.whiteAlpha['35'];

                        const valueColor =
                            isWin ? Colors.game.win :
                            isLose ? Colors.game.loss :
                            isSpinning ? color.accent :
                            Colors.whiteAlpha['55'];

                        return (
                            <Animated.View
                                key={poder.nome}
                                style={[
                                    styles.compactAttrRow,
                                    { backgroundColor: rowBg, borderColor: rowBorder },
                                    isSpinning && !isFinal && { opacity: pulseAnim },
                                ]}
                            >
                                <Text style={[styles.compactAttrLabel, { color: labelColor }]}>
                                    {STAT_ABBR[poder.nome] ?? poder.nome.slice(0, 4).toUpperCase()}
                                </Text>
                                <Text style={[styles.compactAttrValue, { color: valueColor, fontWeight: (isSpinning || isFinal) ? '900' : '700' }]}>
                                    {poder.forca}
                                </Text>
                            </Animated.View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const winsCount = results.filter(r => r === 'win').length;
    const lossCount = results.filter(r => r === 'lose').length;

    // Determine final verdict for done screen
    const playerWon3 = winsCount >= WIN_THRESHOLD;
    const playerLost3 = lossCount >= WIN_THRESHOLD;

    return (
        <View style={styles.wrapper}>
            <Header />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.pageHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.pageTitle}>BATALHA</Text>
                </View>

                {/* Teams side-by-side */}
                <View style={styles.teamsContainer}>
                    {/* Player team */}
                    <View style={styles.teamColumn}>
                        <Text style={styles.teamSectionLabel}>MEU TIME</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.teamRow}
                        >
                            {team.map((p, i) => renderTeamCard(p, i, false))}
                        </ScrollView>
                    </View>

                    <Text style={styles.teamXSeparator}>X</Text>

                    {/* Opponent team */}
                    <View style={styles.teamColumn}>
                        <Text style={[styles.teamSectionLabel, { color: Colors.game.loss + '88', textAlign: 'right' }]}>ADVERSÁRIO</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.teamRow, styles.teamRowRight]}
                        >
                            {team.map((_, i) =>
                                renderTeamCard(OPPONENT_TEAM[i % OPPONENT_TEAM.length], i, true)
                            )}
                        </ScrollView>
                    </View>
                </View>

                {(phase === 'spinning' || phase === 'result' || phase === 'done') && (
                    <View style={styles.scoreBar}>
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreValue, { color: Colors.game.win }]}>{winsCount}</Text>
                            <Text style={styles.scoreLabel}>VITÓRIAS</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreValueSmall, { color: Colors.whiteAlpha['35'] }]}>
                                PRIMEIRO A {WIN_THRESHOLD}
                            </Text>
                            <Text style={[styles.scoreValueSmall, { color: Colors.whiteAlpha['20'] }]}>
                                VENCE
                            </Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreValue, { color: Colors.game.loss }]}>{lossCount}</Text>
                            <Text style={styles.scoreLabel}>DERROTAS</Text>
                        </View>
                    </View>
                )}

                {phase === 'idle' && (
                    <View style={styles.idleArea}>
                        <Text style={styles.idleText}>
                            Seus Pokémons enfrentam o adversário um a um.{'\n'}
                            Um atributo é sorteado e comparado.{'\n'}
                            Se o seu valor for maior, vitória!{'\n'}
                            Primeiro a chegar em {WIN_THRESHOLD} vitórias vence!
                        </Text>
                        <TouchableOpacity style={styles.startButton} onPress={startBattle} activeOpacity={0.8}>
                            <Text style={styles.startButtonText}>⚔ INICIAR BATALHA</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {(phase === 'spinning' || phase === 'result') && currentPokemon && (
                    <View style={styles.battleArea}>
                        {/* VS header */}
                        <View style={styles.vsHeader}>
                            <Text style={styles.vsHeaderText}>
                                {currentPokemon.nome.toUpperCase()}
                                {'  ⚔  '}
                                {currentOpponent.nome.toUpperCase()}
                            </Text>
                        </View>

                        {/* Side-by-side cards */}
                        <View style={styles.vsBattleRow}>
                            {renderBattleCard(currentPokemon, false)}
                            <View style={styles.vsCenter}>
                                <Text style={styles.vsCenterText}>VS</Text>
                            </View>
                            {renderBattleCard(currentOpponent, true)}
                        </View>

                        {phase === 'result' && currentResult !== 'pending' && finalAttrIdx >= 0 && finalOpponentAttrIdx >= 0 && (() => {
                            const myPower = currentPokemon.poderes[finalAttrIdx];
                            const oppPower = currentOpponent.poderes[finalOpponentAttrIdx];
                            const myStatLabel = STAT_ABBR[myPower?.nome ?? ''] ?? myPower?.nome?.toUpperCase() ?? '';
                            const oppStatLabel = STAT_ABBR[oppPower?.nome ?? ''] ?? oppPower?.nome?.toUpperCase() ?? '';
                            return (
                                <Animated.View
                                    style={[
                                        styles.resultBadge,
                                        currentResult === 'win' ? styles.resultWin : styles.resultLose,
                                        { opacity: flashAnim },
                                    ]}>
                                    <Text style={[
                                        styles.resultTitle,
                                        { color: currentResult === 'win' ? Colors.game.win : Colors.game.loss },
                                    ]}>
                                        {currentResult === 'win' ? '⚔ VITÓRIA!' : '💀 DERROTA!'}
                                    </Text>
                                    <Text style={styles.resultDetail}>
                                        {myStatLabel}{' '}
                                        <Text style={{ color: currentResult === 'win' ? Colors.game.win : Colors.game.loss, fontWeight: '900' }}>
                                            {myPower?.forca}
                                        </Text>
                                        {currentResult === 'win' ? ' > ' : ' ≤ '}
                                        {oppStatLabel}{' '}
                                        <Text style={{ color: currentResult === 'win' ? Colors.game.loss : Colors.game.win, fontWeight: '900' }}>
                                            {oppPower?.forca ?? '?'}
                                        </Text>
                                    </Text>
                                </Animated.View>
                            );
                        })()}

                        {phase === 'spinning' && (
                            <View style={styles.spinIndicator}>
                                <Text style={styles.spinIndicatorText}>ROLETA GIRANDO...</Text>
                            </View>
                        )}
                    </View>
                )}

                {phase === 'done' && (
                    <View style={styles.doneArea}>
                        <View style={styles.summaryBox}>
                            <Text style={[
                                styles.summaryTitle,
                                { color: playerWon3 ? Colors.game.win : playerLost3 ? Colors.game.loss : Colors.white },
                            ]}>
                                {playerWon3 ? 'VOCÊ VENCEU!' : playerLost3 ? 'VOCÊ PERDEU!' : 'BATALHA ENCERRADA'}
                            </Text>
                            <View style={styles.summaryRow}>
                                <View style={[styles.summaryItem, { borderColor: Colors.game.win + '40', backgroundColor: Colors.game.win + '12' }]}>
                                    <Text style={[styles.summaryCount, { color: Colors.game.win }]}>{winsCount}</Text>
                                    <Text style={styles.summaryItemLabel}>VITÓRIAS</Text>
                                </View>
                                <View style={[styles.summaryItem, { borderColor: Colors.game.loss + '40', backgroundColor: Colors.game.loss + '12' }]}>
                                    <Text style={[styles.summaryCount, { color: Colors.game.loss }]}>{lossCount}</Text>
                                    <Text style={styles.summaryItemLabel}>DERROTAS</Text>
                                </View>
                            </View>
                            <Text style={styles.summaryVerdict}>
                                {playerWon3
                                    ? '🏆 3 vitórias! Adversário derrotado!'
                                    : playerLost3
                                    ? '💀 3 derrotas! Você foi eliminado!'
                                    : winsCount > lossCount
                                    ? '🏆 Seu time dominou!'
                                    : winsCount === lossCount
                                    ? '🤝 Empate!'
                                    : '😔 Melhor sorte na próxima!'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.startButton} onPress={resetBattle} activeOpacity={0.8}>
                            <Text style={styles.startButtonText}>⚔ BATALHAR NOVAMENTE</Text>
                        </TouchableOpacity>
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
    scrollContent: {
        paddingBottom: 32,
    },

    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        marginTop: 20,
        marginBottom: 16,
    },
    sectionAccent: {
        width: 3,
        height: 16,
        borderRadius: 2,
        backgroundColor: Colors.btnPrimary,
    },
    pageTitle: {
        color: Colors.white,
        fontSize: isWeb ? 13 : 11,
        fontWeight: '900',
        letterSpacing: 3,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },

    teamsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        marginBottom: 12,
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
    teamSectionLabel: {
        color: Colors.whiteAlpha['35'],
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
    },
    teamRow: {
        gap: 10,
        paddingBottom: 4,
    },
    teamRowRight: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    teamCard: {
        width: isWeb ? 88 : 76,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        gap: 4,
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 }
            : { boxShadow: '0 3px 12px rgba(0,0,0,0.5)' } as any),
    },
    teamCardActive: {
        ...(Platform.OS !== 'web'
            ? { shadowOpacity: 0.8, shadowRadius: 12, elevation: 10 }
            : { boxShadow: '0 0 16px rgba(255,107,53,0.5)' } as any),
    },
    teamCardImage: {
        width: isWeb ? 48 : 40,
        height: isWeb ? 48 : 40,
    },
    teamCardName: {
        fontSize: 7,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'capitalize',
        textAlign: 'center',
    },
    teamBadge: {
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    teamBadgeText: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 1,
    },

    scoreBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.whiteAlpha['08'],
        paddingVertical: 10,
        gap: 24,
    },
    scoreItem: {
        alignItems: 'center',
        gap: 2,
    },
    scoreValue: {
        fontSize: isWeb ? 22 : 18,
        fontWeight: '900',
    },
    scoreValueSmall: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
        textAlign: 'center',
    },
    scoreLabel: {
        color: Colors.whiteAlpha['35'],
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    scoreDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.whiteAlpha['08'],
    },

    idleArea: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 20,
    },
    idleText: {
        color: Colors.whiteAlpha['35'],
        fontSize: isWeb ? 12 : 11,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '600',
    },
    startButton: {
        backgroundColor: Colors.btnPrimary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 10,
        ...(Platform.OS !== 'web'
            ? { shadowColor: Colors.btnPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 }
            : { boxShadow: '0 4px 16px rgba(255,107,53,0.4)' } as any),
    },
    startButtonText: {
        color: Colors.white,
        fontSize: isWeb ? 13 : 12,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },

    battleArea: {
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 12,
    },
    vsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.btnPrimary + '18',
        borderWidth: 1,
        borderColor: Colors.btnPrimary + '40',
    },
    vsHeaderText: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 10 : 9,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'capitalize',
    },
    vsBattleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        width: '100%',
    },
    vsCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        width: 28,
    },
    vsCenterText: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 12 : 11,
        fontWeight: '900',
        letterSpacing: 1,
    },

    // Compact battle card (side-by-side)
    compactCard: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 2,
        overflow: 'hidden',
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
            : { boxShadow: '0 4px 16px rgba(0,0,0,0.6)' } as any),
    },
    compactCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 7,
        borderBottomWidth: 1,
        gap: 4,
    },
    compactCardTag: {
        fontSize: 7,
        fontWeight: '900',
        letterSpacing: 1,
    },
    compactPokeName: {
        fontSize: isWeb ? 10 : 9,
        fontWeight: '900',
        letterSpacing: 0.3,
        textTransform: 'capitalize',
        flex: 1,
    },
    compactPokeIndex: {
        fontSize: 8,
        fontWeight: '700',
    },
    compactImageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: isWeb ? 90 : 72,
        marginHorizontal: 8,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    compactImage: {
        width: isWeb ? 70 : 58,
        height: isWeb ? 70 : 58,
    },
    compactAttrs: {
        borderTopWidth: 1,
        paddingHorizontal: 6,
        paddingTop: 6,
        paddingBottom: 8,
        gap: 2,
    },
    compactAttrRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 3,
        paddingHorizontal: 5,
        borderRadius: 5,
        borderWidth: 1,
    },
    compactAttrLabel: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
        width: 30,
    },
    compactAttrValue: {
        fontSize: 10,
        textAlign: 'right',
    },

    spinIndicator: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.btnPrimary + '18',
        borderWidth: 1,
        borderColor: Colors.btnPrimary + '40',
    },
    spinIndicatorText: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 11 : 10,
        fontWeight: '900',
        letterSpacing: 3,
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
            : {} as any),
    },
    resultWin: {
        backgroundColor: Colors.game.win + '15',
        borderColor: Colors.game.win + '60',
        ...(Platform.OS !== 'web' ? { shadowColor: Colors.game.win } : { boxShadow: '0 4px 16px rgba(74,222,128,0.3)' } as any),
    },
    resultLose: {
        backgroundColor: Colors.game.loss + '15',
        borderColor: Colors.game.loss + '60',
        ...(Platform.OS !== 'web' ? { shadowColor: Colors.game.loss } : { boxShadow: '0 4px 16px rgba(248,113,113,0.3)' } as any),
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

    /* Done state */
    doneArea: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 8,
        gap: 20,
    },
    summaryBox: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.whiteAlpha['08'],
        padding: 20,
        alignItems: 'center',
        gap: 16,
    },
    summaryTitle: {
        fontSize: isWeb ? 14 : 12,
        fontWeight: '900',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        gap: 4,
    },
    summaryCount: {
        fontSize: 28,
        fontWeight: '900',
    },
    summaryItemLabel: {
        color: Colors.whiteAlpha['35'],
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    summaryVerdict: {
        color: Colors.whiteAlpha['55'],
        fontSize: isWeb ? 12 : 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 16 : 14,
        fontWeight: '900',
        letterSpacing: 4,
    },
    emptySubtitle: {
        color: Colors.whiteAlpha['35'],
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '600',
    },

    bottomSpacer: { height: 20 },
});
