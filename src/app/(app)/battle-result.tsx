import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
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

export default function BattleResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { result, myWins, opponentWins, opponentUsername, resetBattle } = useBattle();

  const entryAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  const won = result?.won ?? false;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleContinue() {
    resetBattle();
    router.replace('/(app)/dashboard' as any);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (insets.top || (Platform.OS === 'ios' ? 44 : 24)) + 20,
            paddingBottom: (insets.bottom || 0) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Result header */}
        <Animated.View
          style={[
            styles.resultHeader,
            {
              opacity: entryAnim,
              transform: [{ scale: scaleAnim }],
              borderColor: won ? Colors.game.win + '50' : Colors.game.loss + '50',
              backgroundColor: won ? Colors.game.win + '10' : Colors.game.loss + '10',
            },
          ]}
        >
          <Text style={styles.resultEmoji}>{won ? '🏆' : '💀'}</Text>
          <Text
            style={[
              styles.resultTitle,
              { color: won ? Colors.game.win : Colors.game.loss },
            ]}
          >
            {won ? 'VOCÊ VENCEU!' : 'VOCÊ PERDEU!'}
          </Text>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, { borderColor: Colors.game.win + '40', backgroundColor: Colors.game.win + '12' }]}>
              <Text style={[styles.scoreNum, { color: Colors.game.win }]}>{myWins}</Text>
              <Text style={styles.scoreLabel}>VITÓRIAS</Text>
            </View>
            <Text style={styles.scoreSep}>×</Text>
            <View style={[styles.scoreBox, { borderColor: Colors.game.loss + '40', backgroundColor: Colors.game.loss + '12' }]}>
              <Text style={[styles.scoreNum, { color: Colors.game.loss }]}>{opponentWins}</Text>
              <Text style={styles.scoreLabel}>DERROTAS</Text>
            </View>
          </View>

          {opponentUsername && (
            <Text style={styles.opponentLabel}>
              vs {opponentUsername}
            </Text>
          )}
        </Animated.View>


        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: won ? Colors.btnPrimary : Colors.surfaceCard }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={[styles.continueBtnText, { color: won ? Colors.white : Colors.whiteAlpha['65'] }]}>
            CONTINUAR
          </Text>
        </TouchableOpacity>

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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 20,
  },

  resultHeader: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    ...(Platform.OS !== 'web'
      ? { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }
      : {}),
  },
  resultEmoji: {
    fontSize: 48,
  },
  resultTitle: {
    fontSize: isWeb ? 18 : 15,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  scoreBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  scoreNum: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: '900',
  },
  scoreLabel: {
    color: Colors.whiteAlpha['35'],
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scoreSep: {
    color: Colors.whiteAlpha['30'],
    fontSize: 18,
    fontWeight: '900',
  },
  opponentLabel: {
    color: Colors.whiteAlpha['35'],
    fontSize: isWeb ? 12 : 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  continueBtn: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.whiteAlpha['12'],
    ...(Platform.OS !== 'web'
      ? { shadowColor: Colors.btnPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }
      : {}),
  },
  continueBtnText: {
    fontSize: isWeb ? 13 : 12,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },

  bottomSpacer: { height: 20 },
});
