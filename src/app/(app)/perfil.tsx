import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Image, ActivityIndicator } from 'react-native';
import { Header } from '@/components/header';
import { Colors } from '@/constants/colors';
import { getStats, StatsResponse } from '@/integration/authIntegration';
import { useAuth } from '@/context/AuthContext';

const isWeb = Platform.OS === 'web';

export default function Perfil() {
    const { user, userId } = useAuth();
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                if (!userId) return;
                const data = await getStats(userId);
                setStats(data);
            } catch (e) {
                console.error('Erro ao carregar stats:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId]);

    return (
        <View style={styles.wrapper}>
            <Header />

            <View style={styles.content}>
                <View style={styles.card}>
                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={require('../../../assets/images/perfil.png')}
                            style={styles.avatar}
                        />
                    </View>

                    {/* Nome */}
                    <Text style={styles.name}>{stats?.username ?? user ?? '...'}</Text>
                    <Text style={styles.role}>Treinador Pokémon</Text>

                    <View style={styles.divider} />

                    {loading ? (
                        <ActivityIndicator color={Colors.btnPrimary} />
                    ) : (
                        <View style={styles.statsBox}>
                            {/* Experiência */}
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>Experiência</Text>
                                <Text style={styles.statValue}>Nível {stats?.level ?? 0}</Text>
                            </View>
                            <View style={styles.xpBarTrack}>
                                <View style={[styles.xpBarFill, { width: `${Math.min((stats?.level ?? 0), 100)}%` as any }]} />
                            </View>

                            <View style={styles.statDivider} />

                            {/* Vitórias */}
                            <View style={styles.statRow}>
                                <View style={styles.statLabelRow}>
                                    <Text style={styles.statIcon}>🏆</Text>
                                    <Text style={styles.statLabel}>Vitórias</Text>
                                </View>
                                <Text style={[styles.statValue, styles.win]}>
                                    {stats?.vitorias ?? 0}
                                </Text>
                            </View>

                            <View style={styles.statDivider} />

                            {/* Derrotas */}
                            <View style={styles.statRow}>
                                <View style={styles.statLabelRow}>
                                    <Text style={styles.statIcon}>💀</Text>
                                    <Text style={styles.statLabel}>Derrotas</Text>
                                </View>
                                <Text style={[styles.statValue, styles.loss]}>
                                    {stats?.derrotas ?? 0}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 32,
    },

    /* Card */
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primaryAlpha['18'],
        alignItems: 'center',
        paddingTop: 64,
        paddingBottom: 28,
        paddingHorizontal: 24,
        shadowColor: Colors.black,
        shadowOpacity: 0.55,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },

    /* Avatar */
    avatarWrapper: {
        position: 'absolute',
        top: -48,
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: Colors.btnPrimary,
        backgroundColor: Colors.surfaceHighlight,
        overflow: 'hidden',
        shadowColor: Colors.btnPrimary,
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    /* Nome */
    name: {
        color: Colors.white,
        fontSize: isWeb ? 22 : 20,
        fontWeight: '900',
        letterSpacing: 1,
        marginTop: 4,
        textTransform: 'capitalize',
    },
    role: {
        color: Colors.whiteAlpha['35'],
        fontSize: isWeb ? 11 : 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 4,
        textTransform: 'uppercase',
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.whiteAlpha['07'],
        marginVertical: 20,
    },

    /* Stats box */
    statsBox: {
        width: '100%',
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.whiteAlpha['06'],
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 4,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIcon: {
        fontSize: 14,
    },
    statLabel: {
        color: Colors.whiteAlpha['55'],
        fontSize: isWeb ? 12 : 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statValue: {
        color: Colors.white,
        fontSize: isWeb ? 13 : 12,
        fontWeight: '800',
    },
    win: {
        color: Colors.game.win,
    },
    loss: {
        color: Colors.game.loss,
    },

    /* XP bar */
    xpBarTrack: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.whiteAlpha['08'],
        borderRadius: 4,
        marginTop: 6,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: Colors.btnPrimary,
        borderRadius: 4,
    },

    statDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.whiteAlpha['05'],
        marginVertical: 6,
    },
});
