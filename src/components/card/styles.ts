import { Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const isWeb = Platform.OS === 'web';

export const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: isWeb ? 20 : 16,
        borderWidth: 1.5,
        borderColor: Colors.primaryAlpha['25'],
        padding: isWeb ? 24 : 18,
        gap: 14,
        ...Platform.select({
            web: {
                boxShadow: '0 0 40px rgba(255,107,53,0.1), 0 0 80px rgba(0,0,0,0.6)',
            } as any,
            default: {
                shadowColor: Colors.btnPrimary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6,
            },
        }),
    },
});
