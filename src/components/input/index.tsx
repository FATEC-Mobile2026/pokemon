import { TextInput, TextInputProps } from "react-native"
import { styles } from "./styles";

type Props = TextInputProps & {
    placeholder: string;
}

export function Input({...rest}: Props) {
    return (
        <TextInput
            style={styles.input}
            {...rest}
        />
    )
}