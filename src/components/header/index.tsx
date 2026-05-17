import React, { useState, useRef } from 'react';

import {
    View,
    Text,
    Platform,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Pressable,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Pokeball } from '@/components/pokeball';
import { Colors } from '@/constants/colors';

const MENU_WIDTH = 260;
const isWeb = Platform.OS === 'web';

function HamburgerIcon({ color = Colors.white }: { color?: string }) {
    return (
        <View style={{ gap: 5 }}>
            <View style={{ width: 22, height: 2, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: 16, height: 2, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: 22, height: 2, backgroundColor: color, borderRadius: 2 }} />
        </View>
    );
}

const size = Platform.OS === 'web' ? 28 : 22;

const MENU_ITEMS = [
    { 
        label: 'Inicio', 
        icon: () => <Pokeball size={size} />,
        route: '/(app)/dashboard' as const },
    { 
        label: 'Perfil',  
        icon: '👤', 
        route: '/(app)/perfil' as const 
    },
    { 
        label: 'Pokédex', 
        icon: '📖', 
        route: '/(app)/pokedex' as const 
    },
    { 
        label: 'Batalha', 
        icon: '⚔️', 
        route: '/(app)/new-pokemon' as const 
    },
] as const;

type Props = {
    showGreeting?: boolean;
};

export function Header({ showGreeting = false }: Props) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [menuOpen, setMenuOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    function openMenu() {
        setMenuOpen(true);
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
    }

    function closeMenu(cb?: () => void) {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: MENU_WIDTH, duration: 220, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
            setMenuOpen(false);
            cb?.();
        });
    }

    function handleItem(route: string) {
        closeMenu(() => router.push(route as any));
    }

    function handleSignOut() {
        closeMenu(async () => {
            await signOut();
            router.replace('/');
        });
    }

    return (
        <>
            <View style={[styles.header, { paddingTop: isWeb ? 28 : insets.top + 12 }]}>
                {showGreeting ? (
                    <View style={styles.headerLeft}>
                        <Text style={styles.welcomeLabel}>Olá,</Text>
                        <Text style={styles.welcomeName}>{user}</Text>
                    </View>
                ) : (
                    <View />
                )}

                <TouchableOpacity onPress={openMenu} style={styles.menuBtn} activeOpacity={0.7}>
                    <HamburgerIcon />
                </TouchableOpacity>
            </View>

            <Modal
                visible={menuOpen}
                transparent
                animationType="none"
                onRequestClose={() => closeMenu()}
                statusBarTranslucent
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()}>
                    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
                </Pressable>

                <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                    <View style={styles.drawerHeader}>
                        <Text style={styles.drawerTitle}>MENU</Text>
                        <TouchableOpacity onPress={() => closeMenu()} activeOpacity={0.7}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.drawerDivider} />

                    <View style={styles.menuItems}>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.menuItem}
                                onPress={() => handleItem(item.route)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuItemIconWrapper}>
                                    {typeof item.icon === 'function'
                                        ? item.icon()
                                        : <Text style={styles.menuItemIcon}>{item.icon}</Text>
                                    }
                                </View>
                                <Text style={styles.menuItemLabel}>{item.label}</Text>
                                <Text style={styles.menuItemArrow}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.drawerDivider} />

                    <TouchableOpacity
                        style={styles.signOutItem}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.menuItemIcon}>🚪</Text>
                        <Text style={styles.signOutLabel}>Sair</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: isWeb ? 28 : 20,
        paddingBottom: 8,
    },
    headerLeft: { gap: 2 },
    welcomeLabel: {
        color: Colors.whiteAlpha['35'],
        fontSize: isWeb ? 11 : 10,
        fontWeight: '800',
        letterSpacing: 3,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    welcomeName: {
        color: Colors.white,
        fontSize: isWeb ? 20 : 17,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    menuBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: Colors.whiteAlpha['06'],
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.overlayDark,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: MENU_WIDTH,
        backgroundColor: Colors.surface,
        borderLeftWidth: 1,
        borderLeftColor: Colors.primaryAlpha['25'],
        paddingTop: isWeb ? 28 : 56,
        paddingBottom: 32,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    drawerTitle: {
        color: Colors.btnPrimary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 4,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    closeBtn: {
        color: Colors.whiteAlpha['45'],
        fontSize: 18,
        lineHeight: 22,
    },
    drawerDivider: {
        height: 1,
        backgroundColor: Colors.whiteAlpha['07'],
        marginHorizontal: 24,
        marginVertical: 8,
    },
    menuItems: {
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 14,
    },
    menuItemIconWrapper: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemIcon: {
        fontSize: 18,
        width: 24,
        textAlign: 'center',
    },
    menuItemLabel: {
        flex: 1,
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    menuItemArrow: {
        color: Colors.primaryAlpha['60'],
        fontSize: 20,
        lineHeight: 22,
    },
    signOutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 14,
        marginTop: 8,
    },
    signOutLabel: {
        color: Colors.btnPrimary,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
