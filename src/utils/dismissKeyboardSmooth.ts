import { Keyboard } from "react-native";
/**
 * Dismiss the keyboard and resolve after it has fully hidden.
 * Prevents modal/sheet close from racing the keyboard animation (bottom flicker).
 */
export function dismissKeyboardSmooth(timeoutMs = 350): Promise<void> {
  const keyboardApi = Keyboard as typeof Keyboard & {
    isVisible?: () => boolean;
  };
  if (typeof keyboardApi.isVisible === "function" && !keyboardApi.isVisible()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      sub.remove();
      clearTimeout(fallback);
      resolve();
    };

    // Wait until keyboard is fully gone (not just starting to hide).
    const sub = Keyboard.addListener("keyboardDidHide", finish);
    const fallback = setTimeout(finish, timeoutMs);
    Keyboard.dismiss();
  });
}
