export interface AlertProps {
    title: string;
    message: string;
    visible: boolean;
    onClose: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';   
}