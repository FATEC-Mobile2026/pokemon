import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthCookie } from '@/context/AuthCookieContext';

import {
    View,
    Text,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Alert } from '@/components/alert';
import { Pokeball } from '@/components/pokeball';
import { Colors } from '@/constants/colors';

export default function Register() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [cep, setCep] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({
        title: '',
        message: '',
        type: 'error' as 'success' | 'error' | 'warning' | 'info',
    });

    const { signUp } = useAuthCookie();

    function showAlert(title: string, message: string, type: typeof alertData.type) {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    }

    async function handleRegister() {
        if (!nome.trim() || !email.trim() || !cep.trim() || !senha.trim() || !confirmacaoSenha.trim()) {
            showAlert('Campos obrigatórios', 'Preencha todos os campos.', 'warning');
            return;
        }

        if (senha.trim() !== confirmacaoSenha.trim()) {
            showAlert('Senhas diferentes', 'A senha e a confirmação não coincidem.', 'error');
            return;
        }

        if (senha.trim().length < 4) {
            showAlert('Senha fraca', 'A senha deve ter pelo menos 4 caracteres.', 'warning');
            return;
        }

        setIsLoading(true);
        const result = await signUp({
            username: nome.trim(),
            password: senha.trim(),
            email: email.trim(),
            cep: cep.trim(),
            roles: ['ADMIN'],
        });
        setIsLoading(false);

        if (!result.ok) {
            showAlert('Erro', result.error ?? 'Não foi possível criar o usuário.', 'error');
            return;
        }

        showAlert('Usuário criado', 'Conta criada com sucesso! Faça login.', 'success');
        setTimeout(() => {
            router.back();
        }, 1500);
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled">
                {Platform.OS === 'web' && (
                    <>
                        <View style={styles.orbBlue} />
                        <View style={styles.orbOrange} />
                    </>
                )}

                <View style={styles.header}>
                    <View style={styles.logoRow}>
                        <Pokeball size={Platform.OS === 'web' ? 28 : 22} />
                        <Text style={styles.logoText}>PokeBattle</Text>
                    </View>
                    <Text style={styles.subtitle}>Crie sua conta para entrar na batalha</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Criar Usuário</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Nome</Text>
                        <Input
                            placeholder=""
                            onChangeText={setNome}
                            value={nome}
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email</Text>
                        <Input
                            placeholder=""
                            onChangeText={setEmail}
                            value={email}
                            autoCorrect={false}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>CEP</Text>
                        <Input
                            placeholder=""
                            onChangeText={setCep}
                            value={cep}
                            autoCorrect={false}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <Input
                            placeholder=""
                            secureTextEntry
                            onChangeText={setSenha}
                            value={senha}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Confirmação da Senha</Text>
                        <Input
                            placeholder=""
                            secureTextEntry
                            onChangeText={setConfirmacaoSenha}
                            value={confirmacaoSenha}
                        />
                    </View>

                    <Button
                        title={isLoading ? 'Criando...' : 'Criar Conta'}
                        onPress={handleRegister}
                        disabled={isLoading}
                        style={{ marginTop: 8 }}
                    />

                    <Button
                        title="Voltar ao Login"
                        onPress={() => router.back()}
                        style={styles.btnSecondary}
                    />
                </View>
            </ScrollView>

            <Alert
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
                visible={isAlertVisible}
                onClose={() => setIsAlertVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    container: {
        flexGrow: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: isWeb ? 32 : 24,
        minHeight: '100%' as any,
        gap: 24,
        position: 'relative',
    },
    orbBlue: {
        position: 'absolute', width: 500, height: 500, borderRadius: 250,
        backgroundColor: Colors.semantic.info.border, top: -200, left: -200, opacity: 0.06,
        ...Platform.select({ web: { filter: 'blur(80px)' } as any }),
    },
    orbOrange: {
        position: 'absolute', width: 400, height: 400, borderRadius: 200,
        backgroundColor: Colors.btnPrimary, bottom: -100, right: -150, opacity: 0.06,
        ...Platform.select({ web: { filter: 'blur(80px)' } as any }),
    },
    header: { alignItems: 'center', gap: 8, width: '100%', maxWidth: isWeb ? 440 : undefined },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    logoText: {
        color: Colors.white, fontSize: isWeb ? 22 : 18, fontWeight: '900', letterSpacing: 2,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    subtitle: {
        color: Colors.whiteAlpha['40'], fontSize: isWeb ? 13 : 12,
        textAlign: 'center', lineHeight: 20, maxWidth: 300,
    },
    card: {
        width: '100%', maxWidth: isWeb ? 440 : undefined,
        backgroundColor: Colors.surface, borderRadius: isWeb ? 20 : 16,
        borderWidth: 1.5, borderColor: Colors.primaryAlpha['30'],
        padding: isWeb ? 28 : 20, gap: 16,
        ...Platform.select({
            web: { boxShadow: '0 0 40px rgba(255,107,53,0.15), 0 0 80px rgba(0,0,0,0.6)' } as any,
            default: {
                shadowColor: Colors.btnPrimary, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
            },
        }),
    },
    cardTitle: {
        color: Colors.btnPrimary, fontSize: isWeb ? 11 : 10, fontWeight: '800',
        letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4,
        fontFamily: Platform.OS === 'web' ? "'Press Start 2P', monospace" : undefined,
    },
    fieldGroup: { gap: 6 },
    label: {
        color: Colors.whiteAlpha['50'], fontSize: 12,
        fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase',
    },
    btnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primaryAlpha['60'],
        ...Platform.select({
            web: { boxShadow: 'none' } as any,
            default: { shadowOpacity: 0, elevation: 0 },
        }),
    },
});
