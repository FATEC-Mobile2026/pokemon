import React, { useEffect } from "react";
import { Alert as RNAlert } from "react-native";
import { AlertProps } from "./types";

const AlertAndroid: React.FC<AlertProps> = ({ title, message, visible, onClose }) => {
    useEffect(() => {
        if(visible) {
            RNAlert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
        }
    }, [visible]);

    return null;
};

export default AlertAndroid;