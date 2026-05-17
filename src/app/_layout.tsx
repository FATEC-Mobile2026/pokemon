import { AuthProvider } from "@/context/AuthContext";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { useEffect } from "react";

export default function Root() {
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Inject Google Fonts for web
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;700;800;900&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    return (
        <AuthProvider>
            <Slot />
        </AuthProvider>
    );
}
