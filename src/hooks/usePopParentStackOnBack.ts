import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

/**
 * When a screen is the entry point of a root-level nested stack, Android back
 * should dismiss the whole stack instead of exiting the app.
 */
export function usePopParentStackOnBack(enabled = true) {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS !== "android") return undefined;

      const onBackPress = () => {
        const parent = navigation.getParent();
        if (parent?.canGoBack?.()) {
          parent.goBack();
          return true;
        }
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [enabled, navigation])
  );
}
