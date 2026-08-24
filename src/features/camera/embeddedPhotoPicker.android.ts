import { NativeModules } from "react-native";
export async function isEmbeddedPhotoPickerAvailable(): Promise<boolean> {
  const module = NativeModules.EmbeddedPhotoPickerModule;
  if (!module?.isAvailable) {
    return false;
  }
  return module.isAvailable();
}
