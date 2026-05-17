import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Pokeball } from '@/components/pokeball';
import { Colors } from '@/constants/colors';

const BALL_SIZE = 36;
const DURATION = 500;

function PulseBall({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: DURATION, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: DURATION, useNativeDriver: true }),
        Animated.delay((2 - delay / DURATION) * DURATION),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <Pokeball size={BALL_SIZE} />
    </Animated.View>
  );
}

export function PokeballLoading() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PulseBall delay={0} />
        <PulseBall delay={DURATION} />
        <PulseBall delay={DURATION * 2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
});
