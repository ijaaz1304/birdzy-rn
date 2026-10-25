import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Modal, Text as NativeText } from "react-native";
import { SettingsAccountDialog } from "../src/features/settings/components/SettingsAccountDialog";
import { Button } from "../src/atoms";

jest.mock("../src/assets/freeScanClose.svg", () => () => null);
jest.mock("../src/atoms", () => ({
  Text: require("react-native").Text,
  Button: () => null,
}));
jest.mock("../src/hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      surfacePrimary: "#FFFFFF",
      textPrimary: "#111111",
      border: "#E7E7E7",
    },
  }),
}));
let renderer: ReactTestRenderer;
const button = (title: string) =>
  renderer.root
    .findAllByType(Button)
    .find((node) => node.props.title === title)!;
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("only confirms deletion through Yes, Delete and retains a failed request for retry", async () => {
  const confirm = jest
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  const close = jest.fn();
  await act(async () => {
    renderer = create(
      <SettingsAccountDialog
        visible
        kind="delete"
        icon={1}
        onClose={close}
        onConfirm={confirm}
      />
    );
  });
  expect(confirm).not.toHaveBeenCalled();
  await act(async () => {
    await button("Yes, Delete").props.onPress();
  });
  expect(close).not.toHaveBeenCalled();
  expect(
    renderer.root
      .findAllByType(NativeText)
      .map((node) => node.props.children)
      .join(" ")
  ).toContain("Could not delete your account");
  await act(async () => {
    await button("Yes, Delete").props.onPress();
  });
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(close).toHaveBeenCalledTimes(1);
});
it("prevents duplicate logout requests and dismissal while the request is pending", async () => {
  let resolve!: () => void;
  const confirm = jest.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      })
  );
  const close = jest.fn();
  await act(async () => {
    renderer = create(
      <SettingsAccountDialog
        visible
        kind="logout"
        onClose={close}
        onConfirm={confirm}
      />
    );
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = button("Yes").props.onPress();
  });
  expect(button("No, Thanks").props.disabled).toBe(true);
  await act(async () => {
    await button("Yes").props.onPress();
    renderer.root.findByType(Modal).props.onRequestClose();
  });
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  await act(async () => {
    resolve();
    await pending;
  });
  expect(close).toHaveBeenCalledTimes(1);
});
