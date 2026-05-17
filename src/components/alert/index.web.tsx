import React, { useEffect } from "react";
import { AlertProps } from "./types";
import { View, Text, TouchableOpacity, Modal, Animated, Platform, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const AlertWeb: React.FC<AlertProps> = ({ title, message, visible, onClose, type = 'info' }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(onClose, 6000);
            return () => clearTimeout(timer);
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, fadeAnim, onClose]);

    const semanticColors = {
        error:   Colors.semantic.error,
        success: Colors.semantic.success,
        warning: Colors.semantic.warning,
        info:    Colors.semantic.info,
    };

    const currentColors = semanticColors[type];

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            animationType="none"
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            opacity: fadeAnim,
                            backgroundColor: currentColors.bg,
                            borderLeftColor: currentColors.border,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <Text style={[styles.title, { color: currentColors.text }]}>{title}</Text>
                        <Text style={[styles.message, { color: currentColors.text }]}>{message}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeText, { color: currentColors.text }]}>✕</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 400,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderLeftWidth: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        ...Platform.select({
            web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.6)' } as any,
            default: { elevation: 10 },
        }),
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontWeight: '800',
        fontSize: 15,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 13,
        lineHeight: 20,
        opacity: 0.9,
    },
    closeButton: {
        padding: 4,
    },
    closeText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AlertWeb;
