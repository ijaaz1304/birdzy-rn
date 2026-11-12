/**
 * Chat Interface Component for Onboarding
 * Shows a sample chat conversation with inclined/tilted design
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { UI_COLORS } from "../../../constants/colorConstants";
import { Text } from "../../../atoms";
import { Images } from "../../../assets";
import Icon from "react-native-vector-icons/Ionicons";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  icon?: string;
  image?: boolean;
}

const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    text: "I heard a bird call on my morning walk. Can you help me identify it?",
    isUser: true,
  },
  {
    id: "2",
    text: "Of course! Do you have a recording, or can you describe the size, colors, and behavior?",
    isUser: false,
    icon: "bug-outline",
  },
  {
    id: "3",
    text: "",
    isUser: true,
    image: true,
  },
  {
    id: "4",
    text: "What bird is in this photo?",
    isUser: true,
  },
  {
    id: "5",
    text: "That looks like an American Robin — look for the orange breast, dark head, and yellow bill.",
    isUser: false,
    icon: "leaf-outline",
  },
];

export const ChatInterface: React.FC = () => {
  const theme = useTheme();
  const _colors = theme.colors;
  const styles = createStyles(theme);

  const renderMessage = (message: ChatMessage) => {
    if (message.image) {
      return (
        <View
          key={message.id}
          style={[styles.messageContainer, styles.userMessage]}
        >
          <View style={[styles.imageBubble, styles.inclinedRight]}>
            <AppImage
              source={Images.plantSample}
              style={styles.sampleImage}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {!message.isUser && message.icon && (
          <View style={styles.iconContainer}>
            <Icon
              name={message.icon}
              size={16}
              color={
                message.icon === "bug-outline"
                  ? theme.colors.error
                  : theme.colors.success
              }
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            message.isUser
              ? [
                  styles.userBubble,
                  styles.inclinedRight,
                  { backgroundColor: theme.colors.warning },
                ]
              : [
                  styles.aiBubble,
                  styles.inclinedLeft,
                  { backgroundColor: theme.colors.surfaceVariant },
                ],
          ]}
        >
          <Text
            variant="body"
            size="small"
            color={message.isUser ? "textInverse" : "text"}
            style={styles.messageText}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.chatContainer}>{CHAT_MESSAGES.map(renderMessage)}</View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    chatContainer: {
      width: "100%",
      paddingHorizontal: spacing[4],
      paddingVertical: 20,
      gap: 12,
    },
    messageContainer: {
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    userMessage: {
      justifyContent: "flex-end",
      alignItems: "flex-end",
    },
    aiMessage: {
      justifyContent: "flex-start",
      alignItems: "flex-start",
    },
    messageBubble: {
      maxWidth: "75%",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 18,
    },
    userBubble: {
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      borderBottomLeftRadius: 4,
    },
    messageText: {
      lineHeight: 18,
    },
    iconContainer: {
      width: 24,
      height: 24,
      borderRadius: Radius.md,
      backgroundColor: theme.colors.surfacePrimary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
      marginTop: 2,
    },
    imageBubble: {
      width: 200,
      height: 150,
      borderRadius: Radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.surfacePrimary,
      shadowColor: UI_COLORS.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sampleImage: {
      width: "100%",
      height: "100%",
    },
    // Inclined/Tilted design styles
    inclinedRight: {
      transform: [{ rotate: "2deg" }],
    },
    inclinedLeft: {
      transform: [{ rotate: "-2deg" }],
    },
  });
