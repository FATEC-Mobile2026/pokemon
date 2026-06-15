import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useBattle } from '@/context/BattleContext';

const isWeb = Platform.OS === 'web';

export default function BattleWaiting() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, opponentUsername, declineBattle } = useBattle();
  const [declined, setDeclined] = useState(false);
  // Rastreia se já estivemos em pending_sent para não confundir status idle
  // inicial (race condition de navegação) com uma recusa real do oponente
  const hasSentRef = useRef(false);
  const navigatedRef = useRef(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Detect when battle was declined by opponent — only after we confirmed pending_sent
  useEffect(() => {
    if (status === 'pending_sent') {
      hasSentRef.current = true;
    } else if (status === 'idle' && hasSentRef.current && !declined) {
      setDeclined(true);
    }
  }, [status, declined]);

  // Safety-net: navigate to arena when battle starts (works from inside the Stack)
  useEffect(() => {
    if (status === 'in_progress' && !navigatedRef.current) {
      navigatedRef.current = true;
      router.replace('/battle-arena' as any);
    }
  }, [status, router]);

  // Spinner animation
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    spin.start();
    pulse.start();
    return () => {
      spin.stop();
      pulse.stop();
    };
  }, []);

  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  async function handleCancel() {
    await declineBattle();
  }

  if (declined) {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Text style={styles.declinedEmoji}>💀</Text>
          <Text style={styles.declinedTitle}>DESAFIO RECUSADO</Text>
          <Text style={styles.declinedSub}>
            {opponentUsername ?? 'Oponente'} recusou o desafio.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>VOLTAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View
          style={[
            styles.spinnerRing,
            { transform: [{ rotate }] },
          ]}
        />

        <Animated.View style={[styles.pokeball, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.pokeballTop} />
          <View style={styles.pokeballBand} />
          <View style={styles.pokeballBottom} />
          <View style={styles.pokeballCenter} />
        </Animated.View>

        <Text style={styles.waitingTitle}>AGUARDANDO...</Text>
        <Text style={styles.waitingLabel}>Desafio enviado para</Text>
        <Text style={styles.opponentName}>{opponentUsername ?? '—'}</Text>
        <Text style={styles.waitingSub}>
          Aguardando resposta do adversário.
        </Text>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },

  // Spinner
  spinnerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: Colors.btnPrimary,
    borderRightColor: Colors.btnPrimary + '55',
    position: 'absolute',
  },

  // Pokeball
  pokeball: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.whiteAlpha['30'],
    marginBottom: 32,
    position: 'relative',
  },
  pokeballTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: Colors.pokeballRed,
  },
  pokeballBand: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 6,
    marginTop: -3,
    backgroundColor: Colors.whiteAlpha['65'],
    zIndex: 2,
  },
  pokeballBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: Colors.white,
  },
  pokeballCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.whiteAlpha['65'],
    zIndex: 3,
  },

  waitingTitle: {
    color: Colors.btnPrimary,
    fontSize: isWeb ? 13 : 11,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  waitingLabel: {
    color: Colors.whiteAlpha['35'],
    fontSize: isWeb ? 12 : 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  opponentName: {
    color: Colors.white,
    fontSize: isWeb ? 20 : 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  waitingSub: {
    color: Colors.whiteAlpha['30'],
    fontSize: isWeb ? 12 : 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  cancelBtn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.whiteAlpha['12'],
    backgroundColor: Colors.whiteAlpha['05'],
  },
  cancelBtnText: {
    color: Colors.whiteAlpha['45'],
    fontSize: isWeb ? 12 : 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // Declined state
  declinedEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  declinedTitle: {
    color: Colors.game.loss,
    fontSize: isWeb ? 14 : 12,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  declinedSub: {
    color: Colors.whiteAlpha['45'],
    fontSize: isWeb ? 13 : 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.whiteAlpha['12'],
  },
  backBtnText: {
    color: Colors.white,
    fontSize: isWeb ? 12 : 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
