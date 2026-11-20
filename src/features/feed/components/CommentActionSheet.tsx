import React from "react";
import { View, StyleSheet } from "react-native";
import { AppSheet } from "../../../components/AppSheet/AppSheet";
import { Button } from "../../../atoms";

type Props = {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
};

export function CommentActionSheet({
  visible,
  onClose,
  onReply,
  onCopy,
}: Props) {
  return (
    <AppSheet
      visible={visible}
      onClose={onClose}
      type="custom"
      payload={{
        title: "Comment actions",
        height: "34%",
        children: (
          <View style={styles.actions}>
            <Button
              title="Reply"
              fullWidth
              onPress={() => {
                onReply();
                onClose();
              }}
            />
            <Button
              title="Copy text"
              fullWidth
              variant="outline"
              onPress={() => {
                onCopy();
                onClose();
              }}
            />
          </View>
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({ actions: { gap: 12, paddingVertical: 12 } });
