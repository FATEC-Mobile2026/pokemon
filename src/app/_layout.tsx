import { AuthProvider } from "@/context/AuthContext";
import { AuthCookieProvider } from "@/context/AuthCookieContext";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { useEffect } from "react";

export default function Root() {
    useEffect(() => {
        if (Platform.OS === 'web') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@400;700;800;900&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    return (
        <AuthProvider>
            <AuthCookieProvider>
                <Slot />
            </AuthCookieProvider>
        </AuthProvider>
    );
}
