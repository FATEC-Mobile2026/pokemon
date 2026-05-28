import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Platform,
    useWindowDimensions,
    Image,
} from 'react-native';
import { Header } from '@/components/header';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getPokemons } from '@/integration/pokemonIntegration';
import { useDatabase } from '@/context/DatabaseContext';
import { Pokemon, Poder } from '@/@types/pokemon';
import { getColor, Colors } from '@/constants/colors';
import { TYPE_MAP, TYPE_ICONS, STAT_ABBR } from '@/constants/pokemon';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';

const isWeb = Platform.OS === 'web';

const COLS = 2;
const CARD_GAP = 10;
const GRID_H_PAD = 16;

const MY_TEAM_SIZE = 5;
const POKEDEX_SIZE = 25;
const MY_TEAM_CARD_WIDTH = 130;
const MY_TEAM_CARD_HEIGHT = 118;

export default function Dashboard() {
    const { width } = useWindowDimensions();
    const { pokemonRepository } = useDatabase();
    const [loading, setLoading] = useState(true);
    const [myTeam, setMyTeam] = useState<Pokemon[]>([]);
    const [randomPokemons, setRandomPokemons] = useState<Pokemon[]>([]);

    const cardWidth = Math.floor((width - GRID_H_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS);

    useEffect(() => {
        async function load() {
            try {
                let all: Pokemon[];

                const cached = await pokemonRepository.count();

                if (cached === 0) {
                    // Primeira execução: busca na API e persiste no SQLite
                    const fetched = await getPokemons(151);
                    await pokemonRepository.saveMany(fetched);
                    all = fetched;
                } else {
                    // Dados já persistidos: lê direto do SQLite
                    all = await pokemonRepository.getAll();
                }

                const shuffled = [...all].sort(() => Math.random() - 0.5);
                setMyTeam(shuffled.slice(0, MY_TEAM_SIZE));
                setRandomPokemons(shuffled.slice(MY_TEAM_SIZE, MY_TEAM_SIZE + POKEDEX_SIZE));
            } catch (e) {
                console.error('Erro ao carregar pokémons:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [pokemonRepository]);

    const renderMyTeamCard = (pokemon: Pokemon) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);
        const hpStat = pokemon.poderes.find(p => p.nome === 'hp');
        const hp = hpStat?.forca ?? 0;

        return (
            <View
                key={pokemon.index}
                style={[
                    styles.myTeamCard,
                    { borderColor: colors.accent, shadowColor: colors.accent },
                ]}
            >
                <View style={[styles.shimmerStrip, { backgroundColor: colors.accent + '18' }]} />
                <View style={[styles.innerCard, { backgroundColor: colors.bg }]}>
                    {/* Nome + HP */}
                    <View style={[styles.topBar, { backgroundColor: colors.accent + '22', borderBottomColor: colors.accent + '55' }]}>
                        <Text style={[styles.pokeName, { color: Colors.white }]} numberOfLines={1}>
                            {pokemon.nome}
                        </Text>
                        <View style={styles.hpRow}>
                            <Text style={styles.hpLabel}>HP</Text>
                            <Text style={[styles.hpValue, { color: colors.accent }]}>{hp}</Text>
                        </View>
                    </View>
                    {/* Imagem */}
                    <View style={[
                        styles.imageWrapper,
                        styles.myTeamImageWrapper,
                        { borderColor: colors.accent + '33', backgroundColor: colors.accent + '0A' },
                    ]}>
                        <View style={[styles.cornerTL, { borderColor: colors.accent + '55' }]} />
                        <View style={[styles.cornerBR, { borderColor: colors.accent + '55' }]} />
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={styles.myTeamImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>
                <View style={[styles.glowRing, { borderColor: colors.accent + '22' }]} />
            </View>
        );
    };

    const renderGridCard = (pokemon: Pokemon) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);
        const hpStat = pokemon.poderes.find(p => p.nome === 'hp');
        const hp = hpStat?.forca ?? 0;

        return (
            <View
                key={pokemon.index}
                style={[
                    styles.outerFrame,
                    { width: cardWidth, borderColor: colors.accent, shadowColor: colors.accent },
                ]}
            >
                {/* holographic shimmer strip */}
                <View style={[styles.shimmerStrip, { backgroundColor: colors.accent + '18' }]} />

                {/* inner card */}
                <View style={[styles.innerCardStatic, { backgroundColor: colors.bg }]}>

                    {/* ── TOP BAR ── */}
                    <View style={[styles.topBar, { backgroundColor: colors.accent + '22', borderBottomColor: colors.accent + '55' }]}>
                        <Text style={[styles.pokeName, { color: Colors.white }]} numberOfLines={1}>
                            {pokemon.nome}
                        </Text>
                        <View style={styles.hpRow}>
                            <Text style={styles.hpLabel}>HP</Text>
                            <Text style={[styles.hpValue, { color: colors.accent }]}>{hp}</Text>
                        </View>
                    </View>

                    {/* ── IMAGE AREA ── */}
                    <View style={[
                        styles.imageWrapper,
                        { borderColor: colors.accent + '33', backgroundColor: colors.accent + '0A' },
                    ]}>
                        <View style={[styles.cornerTL, { borderColor: colors.accent + '55' }]} />
                        <View style={[styles.cornerBR, { borderColor: colors.accent + '55' }]} />
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={styles.pokemonImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* ── FOOTER: tipos + index ── */}
                    <View style={[styles.footerRow, { borderTopColor: colors.accent + '33' }]}>
                        <View style={styles.typesRow}>
                            {ptTypes.map(t => (
                                <View key={t} style={[styles.typePill, { backgroundColor: colors.accent + '25', borderColor: colors.accent + '55' }]}>
                                    <Text style={styles.typeEmoji}>{TYPE_ICONS[t] ?? '⭐'}</Text>
                                    <Text style={[styles.typeLabel, { color: colors.accent }]}>{t}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.indexNumber, { color: colors.accent + 'BB' }]}>#{pokemon.index}</Text>
                    </View>

                    {/* ── PODERES ── */}
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
                                <Text style={[styles.statValue, { color: colors.accent }]}>{poder.forca}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* outer glow ring */}
                <View style={[styles.glowRing, { borderColor: colors.accent + '22' }]} />
            </View>
        );
    };

    return (
        <View style={styles.wrapper}>
            <Header showGreeting />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>MEU TIME</Text>
                    {!loading && <Text style={styles.sectionSub}>{myTeam.length} selecionados</Text>}
                </View>

                {!loading && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectedList}
                        decelerationRate="fast"
                        snapToInterval={MY_TEAM_CARD_WIDTH + CARD_GAP}
                        snapToAlignment="start"
                    >
                        {myTeam.map(pokemon => renderMyTeamCard(pokemon))}
                        <View style={styles.horizontalEnd} />
                    </ScrollView>
                )}

                <View style={[styles.sectionHeader, styles.sectionHeaderList]}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>MEUS POKÉMONS</Text>
                    {!loading && <Text style={styles.sectionSub}>25 aleatórios</Text>}
                </View>

                {loading ? (
                    <PokeballLoading />
                ) : (
                    <View style={[styles.grid, { paddingHorizontal: GRID_H_PAD, gap: CARD_GAP }]}>
                        {randomPokemons.map(pokemon => renderGridCard(pokemon))}
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
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        marginBottom: 12,
        marginTop: 20,
    },
    sectionHeaderList: {
        marginTop: 28,
    },
    sectionAccent: {
        width: 3,
        height: 16,
        borderRadius: 2,
        backgroundColor: Colors.btnPrimary,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: isWeb ? 13 : 11,
        fontWeight: '900',
        letterSpacing: 3,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    sectionSub: {
        color: Colors.whiteAlpha['30'],
        fontSize: isWeb ? 11 : 10,
        fontWeight: '600',
        letterSpacing: 1,
        marginLeft: 'auto',
    },

    /* ── Meu Time ── */
    selectedList: {
        paddingHorizontal: GRID_H_PAD,
        paddingBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
    },

    horizontalEnd: {
        width: 10,
    },

    /* ── Grid ── */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    /* ── Meu Time card (apenas nome + HP) ── */
    myTeamCard: {
        width: MY_TEAM_CARD_WIDTH,
        height: MY_TEAM_CARD_HEIGHT,
        borderRadius: 14,
        borderWidth: 2,
        overflow: 'hidden',
        marginRight: CARD_GAP,
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
            : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' } as any),
    },
    myTeamImageWrapper: {
        height: 68,
        marginVertical: 4,
    },
    myTeamImage: {
        width: 60,
        height: 60,
    },

    outerFrame: {
        borderRadius: 14,
        borderWidth: 4,
        overflow: 'hidden',
        marginBottom: CARD_GAP,
        ...(Platform.OS !== 'web'
            ? { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8 }
            : { boxShadow: '0 4px 20px rgba(0,0,0,0.6)' } as any),
    },

    shimmerStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        zIndex: 0,
    },

    innerCard: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },

    innerCardStatic: {
        borderRadius: 12,
        overflow: 'hidden',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
    },

    pokeName: {
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.3,
        flex: 1,
        textTransform: 'capitalize',
    },

    hpRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },

    hpLabel: {
        color: Colors.whiteAlpha['50'],
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },

    hpValue: {
        fontSize: 16,
        fontWeight: '900',
    },

    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: isWeb ? 120 : 80,
        marginHorizontal: 8,
        marginVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },

    cornerTL: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 12,
        height: 12,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRadius: 2,
    },

    cornerBR: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 12,
        height: 12,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderRadius: 2,
    },

    pokemonImage: {
        width: isWeb ? 100 : 72,
        height: isWeb ? 100 : 72,
    },

    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderTopWidth: 1,
    },

    typesRow: {
        flexDirection: 'row',
        gap: 4,
        flex: 1,
        flexWrap: 'wrap',
    },

    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 20,
        borderWidth: 1,
    },

    typeEmoji: {
        fontSize: 9,
    },

    typeLabel: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },

    indexNumber: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    statsSection: {
        borderTopWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
        gap: 4,
    },

    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    statName: {
        color: Colors.whiteAlpha['35'],
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        width: 35,
    },

    statBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: Colors.whiteAlpha['08'],
        borderRadius: 2,
        overflow: 'hidden',
    },

    statBarFill: {
        height: '100%',
        borderRadius: 2,
        opacity: 0.85,
    },
    statValue: {
        fontSize: 8,
        fontWeight: '700',
        width: 22,
        textAlign: 'right',
    },

    glowRing: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 16,
        borderWidth: 1,
        pointerEvents: 'none' as any,
    },

    bottomSpacer: {
        height: 16,
    },
});
