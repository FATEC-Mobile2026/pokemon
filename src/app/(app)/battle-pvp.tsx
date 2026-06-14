import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/header';
import { Input } from '@/components/input';
import { Alert } from '@/components/alert';
import { Colors } from '@/constants/colors';
import { useBattle } from '@/context/BattleContext';

const isWeb = Platform.OS === 'web';

export default function BattlePvp() {
  const router = useRouter();
  const { sendInvite, isConnected } = useBattle();

  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'warning' | 'info',
  });

  async function handleChallenge() {
    const name = targetUsername.trim();
    if (!name) {
      setAlertData({
        title: 'Campo obrigatório',
        message: 'Digite o nome do oponente.',
        type: 'warning',
      });
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    try {
      console.log('[Battle] handleChallenge — WS conectado?', isConnected);
      sendInvite(name);
      router.push('/(app)/battle-waiting' as any);
    } catch (err: any) {
      console.log('[Battle] ERRO no invite — status:', err?.response?.status, 'body:', err?.response?.data);
      const status = err?.response?.status;
      if (status === 409) {
        setAlertData({
          title: 'Oponente offline',
          message: 'Este usuário não está disponível no momento.',
          type: 'warning',
        });
      } else if (status === 404) {
        setAlertData({
          title: 'Usuário não encontrado',
          message: 'Verifique o nome digitado.',
          type: 'error',
        });
      } else {
        setAlertData({
          title: 'Erro',
          message: 'Não foi possível enviar o desafio. Tente novamente.',
          type: 'error',
        });
      }
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* indicador de conexão WS — remover após bug resolvido */}
      <Text style={styles.wsIndicator}>
        WS: {isConnected ? '🟢 conectado' : '🔴 desconectado'}
      </Text>
      <Header />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.pageTitle}>BATALHA PVP</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>DESAFIAR OPONENTE</Text>
          <Text style={styles.cardSubtitle}>
            Digite o nome do treinador que deseja desafiar.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>NOME DO OPONENTE</Text>
            <Input
              placeholder="ex: ash_ketchum"
              value={targetUsername}
              onChangeText={setTargetUsername}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {!isConnected && (
            <Text style={styles.wsStatus}>Conectando ao servidor...</Text>
          )}

          <TouchableOpacity
            style={[styles.challengeBtn, (!isConnected || loading) && styles.challengeBtnDisabled]}
            onPress={handleChallenge}
            activeOpacity={0.8}
            disabled={!isConnected || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.challengeBtnText}>⚔ DESAFIAR</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>COMO FUNCIONA</Text>
          {[
            'Envie um desafio para outro treinador online.',
            'Cada rodada, um atributo é sorteado.',
            'O Pokémon com maior valor vence a rodada.',
            'Primeiro a 3 vitórias ganha a batalha e um Pokémon!',
          ].map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleDot}>•</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Alert
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.btnPrimary,
  },
  pageTitle: {
    color: Colors.white,
    fontSize: isWeb ? 13 : 11,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.btnPrimary + '30',
    padding: isWeb ? 28 : 20,
    gap: 16,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: Colors.btnPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 8,
        }
      : ({ boxShadow: '0 4px 24px rgba(255,107,53,0.15)' } as any)),
  },
  cardTitle: {
    color: Colors.btnPrimary,
    fontSize: isWeb ? 11 : 10,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  cardSubtitle: {
    color: Colors.whiteAlpha['45'],
    fontSize: isWeb ? 13 : 12,
    fontWeight: '600',
    lineHeight: 20,
  },
  fieldGroup: { gap: 6 },
  label: {
    color: Colors.whiteAlpha['50'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  challengeBtn: {
    backgroundColor: Colors.btnPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: Colors.btnPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 8,
        }
      : ({ boxShadow: '0 4px 16px rgba(255,107,53,0.4)' } as any)),
  },
  challengeBtnDisabled: { opacity: 0.6 },
  wsIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 10,
    color: Colors.whiteAlpha['45'],
    zIndex: 10,
  },
  wsStatus: {
    color: Colors.whiteAlpha['45'],
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  challengeBtnText: {
    color: Colors.white,
    fontSize: isWeb ? 13 : 12,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  rules: {
    marginTop: 24,
    gap: 10,
  },
  rulesTitle: {
    color: Colors.whiteAlpha['35'],
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  ruleDot: {
    color: Colors.btnPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  ruleText: {
    color: Colors.whiteAlpha['45'],
    fontSize: isWeb ? 13 : 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});
