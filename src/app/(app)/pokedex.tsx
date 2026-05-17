import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    Platform,
    Image,
    StyleSheet,
    ViewStyle,
} from 'react-native';

import { List } from '@/components/list';
import { Header } from '@/components/header';
import { PokeballLoading } from '@/components/pokeball-loading';
import { getColor, Colors } from '@/constants/colors';
import { getPokemons } from '@/integration/pokemonIntegration';
import { Pokemon, Poder } from '@types/pokemon';
import { TYPE_MAP } from '@/constants/pokemon';

const mapType = (t: string) => TYPE_MAP[t] ?? 'normal';

const STAT_ABBR: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    speed: 'SPD',
};

export default function Pokedex() {
    const [loading, setLoading] = useState(true);
    const [pokemons, setPokemons] = useState<Pokemon[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getPokemons(151);
                setPokemons(data);
            } catch (e) {
                console.error('Erro ao carregar pokémons:', e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleLoadMore = useCallback(() => {}, []);

    const getCardStyle = useCallback((pokemon: Pokemon): ViewStyle => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);
        return { borderColor: colors.accent + '66' };
    }, []);

    const renderPokemonCard = useCallback((pokemon: Pokemon) => {
        const ptTypes = pokemon.tipos.map(mapType);
        const colors = getColor(ptTypes);

        return (
            <View style={styles.cardContent}>
                <View style={[styles.cardWash, { backgroundColor: colors.bg }]} />

                <View style={styles.topRow}>
                    <View style={[styles.imageWrap, {
                        backgroundColor: colors.accent + '18',
                        borderColor: colors.accent + '45',
                    }]}>
                        <Image
                            source={{ uri: pokemon.imagem }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.pokemonName} numberOfLines={1}>
                                {pokemon.nome.toUpperCase()}
                            </Text>
                            <Text style={[styles.pokemonIndex, { color: colors.accent }]}>
                                #{pokemon.index}
                            </Text>
                        </View>

                        <View style={styles.typesRow}>
                            {ptTypes.map((type) => {
                                const tc = getColor([type]);
                                return (
                                    <View
                                        key={type}
                                        style={[styles.typeBadge, {
                                            backgroundColor: tc.accent + '22',
                                            borderColor: tc.accent + '55',
                                        }]}
                                    >
                                        <Text style={[styles.typeBadgeText, { color: tc.accent }]}>
                                            {type.toUpperCase()}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.accent + '35' }]} />

                <View style={styles.powersSection}>
                    <Text style={[styles.powersLabel, { color: colors.accent + 'CC' }]}>
                        PODERES
                    </Text>
                    <View style={styles.statsGrid}>
                        {pokemon.poderes.map((poder: Poder) => (
                            <View key={poder.nome} style={styles.statRow}>
                                <Text style={styles.statName}>
                                    {STAT_ABBR[poder.nome] ?? poder.nome.toUpperCase().slice(0, 6)}
                                </Text>
                                <View style={styles.statBarBg}>
                                    <View style={[styles.statBarFill, {
                                        width: `${Math.min((poder.forca / 150) * 100, 100)}%` as any,
                                        backgroundColor: colors.accent,
                                    }]} />
                                </View>
                                <Text style={[styles.statValue, { color: colors.accent }]}>
                                    {poder.forca}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }, []);

    if (loading) {
        return <PokeballLoading />;
    }

    return (
        <View style={styles.wrapper}>
            <Header />

            <Text style={styles.sectionTitle}>Pokédex</Text>

            <List
                data={pokemons}
                onLoadMore={handleLoadMore}
                renderItemContent={renderPokemonCard}
                cardStyle={getCardStyle}
            />
        </View>
    );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    sectionTitle: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 11 : 10,
        fontWeight: '800',
        letterSpacing: 3,
        textTransform: 'uppercase',
        paddingHorizontal: isWeb ? 28 : 20,
        marginTop: 8,
        marginBottom: 4,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },

    cardContent: {
        position: 'relative',
        overflow: 'hidden',
        gap: 0,
    },
    cardWash: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.45,
        borderRadius: 12,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: isWeb ? 14 : 12,
        paddingBottom: isWeb ? 12 : 10,
    },
    imageWrap: {
        width: 58,
        height: 58,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    image: {
        width: 50,
        height: 50,
    },
    headerInfo: {
        flex: 1,
        gap: 6,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    pokemonName: {
        color: Colors.white,
        fontSize: isWeb ? 15 : 13,
        fontWeight: '900',
        letterSpacing: 0.8,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
        flexShrink: 1,
    },
    pokemonIndex: {
        fontSize: isWeb ? 12 : 11,
        fontWeight: '800',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
        flexShrink: 0,
    },
    typesRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
    },
    typeBadgeText: {
        fontSize: isWeb ? 9 : 8,
        fontWeight: '800',
        letterSpacing: 0.8,
    },

    divider: {
        height: 1,
        marginBottom: isWeb ? 10 : 8,
    },

    powersSection: {
        gap: 6,
    },
    powersLabel: {
        fontSize: isWeb ? 9 : 8,
        fontWeight: '800',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
        marginBottom: 2,
    },
    statsGrid: {
        gap: isWeb ? 5 : 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statName: {
        color: Colors.whiteAlpha['45'],
        fontSize: isWeb ? 9 : 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        width: isWeb ? 52 : 44,
    },
    statBarBg: {
        flex: 1,
        height: 4,
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
        fontSize: isWeb ? 10 : 9,
        fontWeight: '800',
        width: isWeb ? 28 : 24,
        textAlign: 'right',
    },
});
