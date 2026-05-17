import { Platform } from "react-native";
import { AlertProps } from "./types";

import AlertIOS from "./index.ios";
import AlertAndroid from "./index.android";
import AlertWeb from "./index.web";

export {AlertImplementation as Alert};
export * from "./types";

const AlertImplementation = Platform.select({
  ios: AlertIOS,
  android: AlertAndroid,
  web: AlertWeb,
  default: AlertWeb
}) as React.FC<AlertProps>;