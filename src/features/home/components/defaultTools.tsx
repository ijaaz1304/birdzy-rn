import { ImageSourcePropType } from "react-native";
import { Images } from "../../../assets";

export interface Tool {
  id: string;
  title: string;
  iconSource: ImageSourcePropType;
  route?: string;
  onPress?: () => void;
}

export const DEFAULT_TOOLS: Tool[] = [
  {
    id: "identify",
    title: "Identify\nmode",
    iconSource: Images.cameraIcon,
    route: "Identify",
  },
];
