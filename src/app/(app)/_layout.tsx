import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";
import { BattleProvider } from "@/context/BattleContext";

export default function AppLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={Colors.black} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/" />;
    }

    return (
        <BattleProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="battle-arena" options={{ gestureEnabled: false }} />
                <Stack.Screen name="new-pokemon" options={{ gestureEnabled: false }} />
            </Stack>
        </BattleProvider>
    );
}