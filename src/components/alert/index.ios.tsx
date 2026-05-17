import React, { useEffect } from "react";
import { Alert as RNAlert } from "react-native";
import { AlertProps } from "./types";

const AlertIOS: React.FC<AlertProps> = ({ title, message, visible, onClose, type = 'info' }) => {
    useEffect(() => {
        if(visible) {
            RNAlert.alert(title, message, [{ text: 'OK', onPress: onClose, style: type === 'error' ? 'destructive' : 'default' }], { cancelable: false });
        }
    }, [visible, title, message, onClose, type]);

    return null;
};

export default AlertIOS;