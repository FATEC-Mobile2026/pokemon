import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router as globalRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useBattleSocket } from '@/hooks/useBattleSocket';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BattlePokemon = {
  name: string;
  image?: string;
  imageUrl?: string;
  index?: string;
  id?: string;
  types?: string[];
  abilities?: Array<{ name: string; strength: number }>;
  attributes?: Record<string, number>;
};

export type RoundResult = {
  round: number;
  draw: boolean;
  player1: { username: string; pokemon: string; attribute: string; strength: number; won: boolean };
  player2: { username: string; pokemon: string; attribute: string; strength: number; won: boolean };
  scores: Record<string, number>;
};

export type BattleStatus =
  | 'idle'
  | 'pending_sent'
  | 'pending_received'
  | 'in_progress'
  | 'finished';

type InviteFrom = { battleId: string; senderUsername: string };

type BattleState = {
  battleId: string | null;
  status: BattleStatus;
  opponentUsername: string | null;
  myTeam: BattlePokemon[];
  opponentTeam: BattlePokemon[];
  currentRound: number;
  myWins: number;
  opponentWins: number;
  rounds: RoundResult[];
  result: { won: boolean; pokemonId: number | null } | null;
  opponentDisconnected: boolean;
};

type BattleContextValue = BattleState & {
  myUsername: string | null;
  isConnected: boolean;
  sendInvite: (targetUsername: string) => void;
  declineBattle: () => void;
  resetBattle: () => void;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const INITIAL_STATE: BattleState = {
  battleId: null,
  status: 'idle',
  opponentUsername: null,
  myTeam: [],
  opponentTeam: [],
  currentRound: 0,
  myWins: 0,
  opponentWins: 0,
  rounds: [],
  result: null,
  opponentDisconnected: false,
};

const BattleContext = createContext<BattleContextValue>({} as BattleContextValue);

// ─── Provider ────────────────────────────────────────────────────────────────

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const { user, userId } = useAuth();
  const { isConnected, lastEvent, send } = useBattleSocket(user);

  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const [inviteFrom, setInviteFrom] = useState<InviteFrom | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const userRef = useRef(user);
  userRef.current = user;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // ── Handle incoming WebSocket events ───────────────────────────────────────

  useEffect(() => {
    if (!lastEvent?.type) return;
    const ev = lastEvent;

    console.log('[Battle] processando evento:', ev.type);

    switch (ev.type as string) {
      case 'BATTLE_REQUEST':
        setInviteFrom({
          battleId: ev.payload,
          senderUsername: ev.payload,
        });
        setState(s => ({
          ...s,
          status: 'pending_received',
          battleId: ev.payload,
          opponentUsername: ev.payload,
        }));
        break;

      case 'CHALLENGE_SENT':
        break;

      case 'BATTLE_ACCEPTED':
        setInviteFrom(null);
        setState(s => ({
          ...s,
          opponentUsername: ev.payload ?? s.opponentUsername,
        }));
        send(`USER_ID:${userIdRef.current}`);
        break;

      case 'BATTLE_DECLINED':
        setState(s => ({ ...s, status: 'idle', battleId: null }));
        break;

      case 'BATTLE_START': {
        const p1 = ev.player1 as { username: string; team: BattlePokemon[] } | undefined;
        const p2 = ev.player2 as { username: string; team: BattlePokemon[] } | undefined;

        if (!p1 || !p2) {
          console.warn('[Battle] BATTLE_START sem player1/player2:', JSON.stringify(ev));
          setState(s => ({
            ...s,
            status: 'in_progress',
            currentRound: 1,
            myWins: 0,
            opponentWins: 0,
            rounds: [],
            result: null,
          }));
          console.log('[Battle] navegando para battle-arena (sem times)');
          globalRouter.push('/battle-arena' as any);
          break;
        }

        const isPlayer1 = p1.username === userRef.current;
        setState(s => ({
          ...s,
          status: 'in_progress',
          myTeam: isPlayer1 ? p1.team : p2.team,
          opponentTeam: isPlayer1 ? p2.team : p1.team,
          opponentUsername: isPlayer1 ? p2.username : p1.username,
          currentRound: 1,
          myWins: 0,
          opponentWins: 0,
          rounds: [],
          result: null,
        }));
        console.log('[Battle] navegando para battle-arena');
        globalRouter.push('/battle-arena' as any);
        break;
      }

      case 'ERROR':
        console.warn('[Battle] Erro do servidor:', ev.payload);
        break;

      case 'ROUND_RESULT': {
        const round: RoundResult = {
          round: ev.round,
          draw: ev.draw,
          player1: ev.player1,
          player2: ev.player2,
          scores: ev.scores,
        };
        const myUsername = userRef.current ?? '';
        setState(s => ({
          ...s,
          currentRound: ev.round,
          myWins: ev.scores?.[myUsername] ?? s.myWins,
          opponentWins: ev.scores?.[s.opponentUsername ?? ''] ?? s.opponentWins,
          rounds: [...s.rounds, round],
        }));
        break;
      }

      case 'BATTLE_END': {
        const myUsername = userRef.current ?? '';
        const won = ev.winner === myUsername;
        const pokemonId = (ev.pokemon_id as number | undefined) ?? null;
        setState(s => ({
          ...s,
          status: 'finished',
          myWins: ev.scores?.[myUsername] ?? s.myWins,
          opponentWins: ev.scores?.[s.opponentUsername ?? ''] ?? s.opponentWins,
          result: { won, pokemonId: won ? pokemonId : null },
        }));
        globalRouter.push(won ? ('/new-pokemon' as any) : ('/battle-result' as any));
        break;
      }

      case 'OPPONENT_DISCONNECTED':
        setState(s => ({ ...s, opponentDisconnected: true }));
        break;

      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const sendInvite = useCallback((targetUsername: string) => {
    console.log('[Battle] Enviando CHALLENGE para:', targetUsername, '| WS conectado?', isConnected);
    send(`CHALLENGE:${targetUsername}`);
    setState(s => ({
      ...s,
      status: 'pending_sent',
      battleId: targetUsername,
      opponentUsername: targetUsername,
    }));
  }, [isConnected, send]);

  const handleDecline = useCallback(
    (battleId: string) => {
      // battleId == senderUsername no protocolo de teste
      send(`DECLINE:${battleId}`);
      setInviteFrom(null);
      setState(s => ({ ...s, status: 'idle', battleId: null }));
    },
    [send],
  );

  const handleAccept = useCallback((battleId: string) => {
    send(`ACCEPT:${battleId}`);
    setInviteFrom(null);
  }, [send]);

  const declineBattleAction = useCallback(() => {
    const bid = stateRef.current.battleId;
    if (!bid) return;
    handleDecline(bid);
    globalRouter.back();
  }, [handleDecline]);

  const resetBattle = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: BattleContextValue = {
    ...state,
    myUsername: user,
    isConnected,
    sendInvite,
    declineBattle: declineBattleAction,
    resetBattle,
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
      <InviteModal
        invite={inviteFrom}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </BattleContext.Provider>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const INVITE_TIMEOUT = 30;
const isWeb = Platform.OS === 'web';

function InviteModal({
  invite,
  onAccept,
  onDecline,
}: {
  invite: InviteFrom | null;
  onAccept: (battleId: string) => void;
  onDecline: (battleId: string) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(INVITE_TIMEOUT);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!invite) {
      setTimeLeft(INVITE_TIMEOUT);
      progressAnim.setValue(1);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setTimeLeft(INVITE_TIMEOUT);
    progressAnim.setValue(1);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: INVITE_TIMEOUT * 1000,
      useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onDecline(invite.battleId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [invite]);

  if (!invite) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onDecline(invite.battleId)}
    >
      <View style={modal.overlay}>
        <View style={modal.card}>
          <View style={modal.topAccent} />

          <Text style={modal.label}>DESAFIO RECEBIDO</Text>
          <Text style={modal.sender}>{invite.senderUsername}</Text>
          <Text style={modal.subtitle}>quer batalhar com você!</Text>

          <View style={modal.progressBg}>
            <Animated.View
              style={[
                modal.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={modal.timer}>{timeLeft}s</Text>

          <View style={modal.actions}>
            <TouchableOpacity
              style={[modal.btn, modal.btnDecline]}
              onPress={() => onDecline(invite.battleId)}
              activeOpacity={0.8}
            >
              <Text style={[modal.btnText, { color: Colors.game.loss }]}>RECUSAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.btn, modal.btnAccept]}
              onPress={() => onAccept(invite.battleId)}
              activeOpacity={0.8}
            >
              <Text style={[modal.btnText, { color: Colors.white }]}>ACEITAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.btnPrimary + '40',
    padding: 24,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: Colors.btnPrimary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 12,
        }
      : ({ boxShadow: '0 8px 32px rgba(255,107,53,0.3)' } as any)),
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.btnPrimary,
  },
  label: {
    color: Colors.btnPrimary,
    fontSize: isWeb ? 10 : 9,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 8,
    fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
  },
  sender: {
    color: Colors.white,
    fontSize: isWeb ? 22 : 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.whiteAlpha['45'],
    fontSize: isWeb ? 13 : 12,
    fontWeight: '600',
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.whiteAlpha['08'],
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.btnPrimary,
    borderRadius: 2,
  },
  timer: {
    color: Colors.whiteAlpha['35'],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnDecline: {
    borderColor: Colors.game.loss + '50',
    backgroundColor: Colors.game.loss + '12',
  },
  btnAccept: {
    borderColor: Colors.btnPrimary,
    backgroundColor: Colors.btnPrimary,
    ...(Platform.OS !== 'web'
      ? {
          shadowColor: Colors.btnPrimary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 10,
          elevation: 6,
        }
      : ({ boxShadow: '0 4px 14px rgba(255,107,53,0.4)' } as any)),
  },
  btnText: {
    fontSize: isWeb ? 12 : 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBattle() {
  return useContext(BattleContext);
}
