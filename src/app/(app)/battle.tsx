import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Header } from '@/components/header';
import { Colors } from '@/constants/colors';

const isWeb = Platform.OS === 'web';

export default function Battle() {
    return (
        <View style={styles.wrapper}>
            <Header />
            <View style={styles.content}>
                <Text style={styles.title}>BATALHA</Text>
                <Text style={styles.subtitle}>Em breve...</Text>
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
        gap: 12,
    },
    title: {
        color: Colors.btnPrimary,
        fontSize: isWeb ? 22 : 18,
        fontWeight: '900',
        letterSpacing: 4,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    subtitle: {
        color: Colors.whiteAlpha['35'],
        fontSize: isWeb ? 12 : 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
});
