import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const isWeb = Platform.OS === 'web';

export const styles = StyleSheet.create({
    button: {
        width: '100%',
        height: isWeb ? 52 : 48,
        backgroundColor: Colors.btnPrimary,
        borderRadius: isWeb ? 12 : 10,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
            } as any,
            default: {
                shadowColor: Colors.btnPrimary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
            },
        }),
    },
    title: {
        color: Colors.white,
        fontSize: isWeb ? 14 : 13,
        fontWeight: '800',
        letterSpacing: isWeb ? 2 : 1,
        textTransform: 'uppercase',
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
});
