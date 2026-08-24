/**
 * Ask AI Screen - Chat UI with image upload
 * Uses chat interface style from onboarding with send/received messages
 */

import { AppImage } from "@/components/AppImage";
import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Keyboard, Platform, Animated, ScrollView, Dimensions, type KeyboardEvent } from "react-native";
import { showAlert } from "../../../store/alert.store";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { Text } from "../../../atoms";
import { aiService } from "../../../services";
import { AskAIStackParamList } from "../../../navigation/types";
import { Images, UploadIconSvg, AskAiCameraIconSvg, AskAiSendIconSvg } from "../../../assets";
import { LoadingImage } from "../../../components/LoadingImage";
import { ACCENT_COLORS, AI_CHAT_COLORS, UI_COLORS } from "../../../constants/colorConstants";
import { FEATURE_USAGE_KEYS } from "../../../constants/storageConstants";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import ImagePicker from "react-native-image-crop-picker";
import { GalleryAccessPopup } from "../../../components/GalleryAccessPopup";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import { checkStoragePermission, openDeviceSettings } from "../../../services/permissions";
import { useAskAIImagePipeline } from "../hooks/useAskAIImagePipeline";
import { AskAIScreenBackground } from "../components/AskAIScreenBackground";
import { AI_CROPPER_OPTIONS } from "../../../constants/imagePipeline.constants";
import { ASK_AI_STRINGS } from "../../../config/strings/ask-ai.strings";

import { Radius } from "../../../design";

/** Figma 9153:36412 — bottom composer bar */
const COMPOSER_PADDING_TOP = 12;
const COMPOSER_PADDING_BOTTOM_IDLE = 36;
const COMPOSER_PADDING_BOTTOM_KEYBOARD = 8;
const INPUT_BAR_HEIGHT = 48;
const INPUT_BORDER_RADIUS = 24;
const SEND_BUTTON_SIZE = 48;
const MEDIA_ICON_SIZE = 20;
const SEND_ICON_SIZE = 24;

const ASK_AI_SUGGESTED_QUESTIONS = [...ASK_AI_STRINGS.suggestedQuestions];

/** Figma: Radius xl = 24px */
const SUGGESTED_CHIP_BORDER_RADIUS = 24;

const ASK_AI_DAILY_LIMIT = 5;
const ASK_AI_DATE_KEY = FEATURE_USAGE_KEYS.ASK_AI_DATE;
const ASK_AI_COUNT_KEY = FEATURE_USAGE_KEYS.ASK_AI_COUNT;

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getAskAiUsage = async (): Promise<{
  count: number;
  isToday: boolean;
}> => {
  try {
    const date = await AsyncStorage.getItem(ASK_AI_DATE_KEY);
    const countStr = await AsyncStorage.getItem(ASK_AI_COUNT_KEY);
    const today = getTodayKey();
    if (date !== today) return { count: 0, isToday: false };
    const count = parseInt(countStr ?? "0", 10) || 0;
    return { count, isToday: true };
  } catch {
    return { count: 0, isToday: false };
  }
};

const incrementAskAiUsage = async (): Promise<void> => {
  try {
    const today = getTodayKey();
    const countStr = await AsyncStorage.getItem(ASK_AI_COUNT_KEY);
    const date = await AsyncStorage.getItem(ASK_AI_DATE_KEY);
    const count = date === today ? (parseInt(countStr ?? "0", 10) || 0) + 1 : 1;
    await AsyncStorage.setItem(ASK_AI_DATE_KEY, today);
    await AsyncStorage.setItem(ASK_AI_COUNT_KEY, String(count));
  } catch {
    // ignore
  }
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: boolean;
  imageUri?: string;
}

const WELCOME_MESSAGE_ID = "1";

const withoutWelcomeMessage = (msgs: Message[]) =>
  msgs.filter((m) => m.id !== WELCOME_MESSAGE_ID);

type AskAIScreenNavigationProp = NativeStackNavigationProp<
  AskAIStackParamList,
  "AskAIMain"
>;
type AskAIScreenRouteProp = RouteProp<AskAIStackParamList, "AskAIMain">;

export const AskAIScreen: React.FC = () => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const navigation = useNavigation<AskAIScreenNavigationProp>();
  const route = useRoute<AskAIScreenRouteProp>();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const flatListRef = useRef<FlatList>(null);
  const initialMessageProcessedRef = useRef(false);
  const selectedImageProcessedRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const isDark = useIsDark();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: WELCOME_MESSAGE_ID,
      text: ASK_AI_STRINGS.welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [showLimitSheet, setShowLimitSheet] = useState(false);
  const [showGalleryPopup, setShowGalleryPopup] = useState(false);
  const [photosBlocked, setPhotosBlocked] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const blockIfAskAiLimitReached = async (): Promise<boolean> => {
    if (isPremium) return false;
    const usage = await getAskAiUsage();
    if (!(usage.isToday && usage.count >= ASK_AI_DAILY_LIMIT)) return false;
    analyticsService.logEvent(EVENTS.ask_ai_limit_reached);
    setShowLimitSheet(true);
    return true;
  };

  useEffect(() => {
    const applyKeyboardFrame = (event: KeyboardEvent) => {
      const windowHeight = Dimensions.get("window").height;
      const next = Math.max(0, windowHeight - event.endCoordinates.screenY);
      setIsKeyboardVisible(next > 0);
      setKeyboardHeight(next);
    };
    const hideKeyboard = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };
    const subs = [
      Keyboard.addListener("keyboardDidShow", applyKeyboardFrame),
      Keyboard.addListener("keyboardDidHide", hideKeyboard),
    ];
    if (Platform.OS === "ios") {
      subs.push(
        Keyboard.addListener("keyboardWillShow", applyKeyboardFrame),
        Keyboard.addListener("keyboardWillHide", hideKeyboard),
        Keyboard.addListener("keyboardWillChangeFrame", applyKeyboardFrame)
      );
    }
    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }, []);

  const { processImage, isProcessing: isImageProcessing } =
    useAskAIImagePipeline({
      navigation,
      onError: (message) => showAlert("Error", message),
    });

  // Scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    if (messages.length > 0 || isAiTyping) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isAiTyping]);

  // Keep the latest messages visible when the keyboard opens
  useEffect(() => {
    if (!isKeyboardVisible || messages.length === 0) return;
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [isKeyboardVisible, messages.length]);

  // When opened from home banner with initialMessage, send it and get AI response
  useEffect(() => {
    const initialMessage = route.params?.initialMessage?.trim();
    if (!initialMessage || initialMessageProcessedRef.current) return;
    initialMessageProcessedRef.current = true;

    const sendInitialMessage = async () => {
      if (await blockIfAskAiLimitReached()) return;

      analyticsService.logEvent(EVENTS.ask_ai_message_sent, {
        source: "initial",
      });
      const userMessage: Message = {
        id: Date.now().toString(),
        text: initialMessage,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...withoutWelcomeMessage(prev), userMessage]);
      setIsAiTyping(true);

      try {
        const aiResponse = await aiService.chat(initialMessage);
        if (!isPremium) await incrementAskAiUsage();
        analyticsService.logEvent(EVENTS.ask_ai_response_success);
        setIsAiTyping(false);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("AI chat failed:", error);
        analyticsService.logEvent(EVENTS.ask_ai_response_fail);
        setIsAiTyping(false);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    };

    sendInitialMessage();
  }, [route.params?.initialMessage, navigation, isPremium]);

  useEffect(() => {
    const selectedImageUri = route.params?.selectedImageUri;
    if (
      !selectedImageUri ||
      selectedImageProcessedRef.current === selectedImageUri
    ) {
      return;
    }
    selectedImageProcessedRef.current = selectedImageUri;
    void sendImageFromUri(selectedImageUri);
  }, [route.params?.selectedImageUri]);

  const sendTextMessage = async (
    text: string,
    source?: "input" | "suggestion"
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (await blockIfAskAiLimitReached()) return;

    analyticsService.logEvent(EVENTS.ask_ai_message_sent, {
      has_image: "false",
      ...(source === "suggestion" ? { source: "suggestion" } : {}),
    });
    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [
      ...(source === "suggestion" ? withoutWelcomeMessage(prev) : prev),
      userMessage,
    ]);
    setIsAiTyping(true);

    try {
      const aiResponse = await Promise.race([
        aiService.chat(trimmed),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("AI request timed out. Please try again.")),
            35000
          )
        ),
      ]);
      if (!isPremium) await incrementAskAiUsage();
      analyticsService.logEvent(EVENTS.ask_ai_response_success);
      setIsAiTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI chat failed:", error);
      analyticsService.logEvent(EVENTS.ask_ai_response_fail);
      setIsAiTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          error instanceof Error && error.message
            ? error.message
            : "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const currentInput = inputText;
    setInputText("");
    await sendTextMessage(currentInput);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendTextMessage(question, "suggestion");
  };

  const showSuggestedQuestions =
    (messages.length === 0 ||
      (messages.length === 1 && messages[0].id === WELCOME_MESSAGE_ID)) &&
    !isAiTyping;

  const IMAGE_PICKER_OPTIONS = AI_CROPPER_OPTIONS;

  const sendImageFromUri = async (imageUri: string) => {
    if (await blockIfAskAiLimitReached()) return;

    analyticsService.logEvent(EVENTS.ask_ai_message_sent, {
      has_image: "true",
    });
    const imageMessage: Message = {
      id: Date.now().toString(),
      text: "",
      isUser: true,
      timestamp: new Date(),
      image: true,
      imageUri,
    };
    setMessages((prev) => [...prev, imageMessage]);
    setIsAiTyping(true);

    try {
      const aiResponse = await Promise.race([
        aiService.chat("What can you tell me about this?", [imageUri]),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("AI request timed out. Please try again.")),
            35000
          )
        ),
      ]);
      if (!isPremium) await incrementAskAiUsage();
      analyticsService.logEvent(EVENTS.ask_ai_response_success, {
        type: "image",
      });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI image analysis failed:", err);
      analyticsService.logEvent(EVENTS.ask_ai_response_fail, {
        type: "image",
      });
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          err instanceof Error && err.message
            ? err.message
            : "Sorry, I couldn't process that image. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const openGalleryAndSendImage = async () => {
    Keyboard.dismiss();
    if (await blockIfAskAiLimitReached()) return;
    try {
      const picked = await ImagePicker.openPicker({
        ...IMAGE_PICKER_OPTIONS,
        multiple: false,
      });
      const path = (picked as { path?: string })?.path;
      if (!path) return;
      analyticsService.logEvent(EVENTS.ask_ai_image_uploaded);
      const imageUri = path.startsWith("file://") ? path : `file://${path}`;
      const processed = await processImage(imageUri, { alreadyCropped: true });
      if (!processed) return;
      await sendImageFromUri(processed.uri);
    } catch (error: unknown) {
      const msg = String((error as Error)?.message ?? "");
      if (!msg.toLowerCase().includes("cancel")) {
        console.error("Ask AI upload error:", error);
        showAlert("Error", "Could not open gallery. Please try again.");
      }
    }
  };

  const handleCameraPress = async () => {
    Keyboard.dismiss();
    if (await blockIfAskAiLimitReached()) return;
    try {
      analyticsService.logEvent(EVENTS.ask_ai_camera_used);
      const picked = await ImagePicker.openCamera(IMAGE_PICKER_OPTIONS);
      const path = (picked as { path?: string })?.path;
      if (!path) return;
      const imageUri = path.startsWith("file://") ? path : `file://${path}`;
      const processed = await processImage(imageUri, { alreadyCropped: true });
      if (!processed) return;
      await sendImageFromUri(processed.uri);
    } catch (error: unknown) {
      const msg = String((error as Error)?.message ?? "");
      if (msg.toLowerCase().includes("permission")) {
        showAlert(
          "Camera permission needed",
          "To capture a photo we need camera access. Open settings to allow camera?",
          {
            secondaryText: "Cancel",
            primaryText: "Open Settings",
            onPrimary: () => openDeviceSettings(),
          }
        );
        return;
      }
      if (!msg.toLowerCase().includes("cancel")) {
        console.error("Ask AI camera error:", error);
        showAlert("Error", "Could not open camera. Please try again.");
      }
    }
  };

  const handleUploadPress = async () => {
    if (await blockIfAskAiLimitReached()) return;
    const storage = await checkStoragePermission();
    if (!storage.granted) {
      setPhotosBlocked(!!storage.blocked);
      setShowGalleryPopup(true);
      return;
    }
    await openGalleryAndSendImage();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.image && item.imageUri) {
      return (
        <View
          key={item.id}
          style={[styles.messageContainer, styles.userMessage]}
        >
          <View style={styles.imageBubble}>
            <LoadingImage
              uri={item.imageUri}
              style={styles.plantImage}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    }

    return (
      <View
        key={item.id}
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {!item.isUser && (
          <View style={styles.iconContainer}>
            <AppImage
              source={Images.aiChatIcon}
              style={styles.aiIcon}
              resizeMode="contain"
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            item.isUser
              ? [styles.userBubble, { backgroundColor: colors.warning }]
              : [styles.aiBubble, { backgroundColor: colors.surfaceVariant }],
          ]}
        >
          <Text
            variant="body"
            size="small"
            color={item.isUser ? "text" : "text"}
            style={[
              styles.messageText,
              item.isUser ? { color: colors.onPrimary } : undefined,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <AskAIScreenBackground />

        <View style={styles.screenContent}>
          <View
            style={[
              styles.header,
              {
                paddingHorizontal: spacing[4],
                paddingTop: spacing[4],
                paddingBottom: spacing[2],
              },
            ]}
          >
            <Text
              variant="title"
              size="medium"
              weight="semibold"
              style={{ flex: 1, color: colors.text }}
            >
              {ASK_AI_STRINGS.title}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <AppImage
                source={Images.navCancel}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: colors.textPrimary,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <FlatList
            style={styles.messagesListContainer}
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              {
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[4],
                flexGrow: 1,
                justifyContent: "flex-end",
              },
            ]}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            ListFooterComponent={
              isAiTyping ? (
                <TypingIndicator theme={theme} styles={styles} />
              ) : null
            }
          />

          <View
            style={[
              styles.bottomArea,
              keyboardHeight > 0
                ? {
                    marginBottom:
                      Platform.OS === "android"
                        ? Math.max(0, keyboardHeight - insets.bottom)
                        : keyboardHeight,
                  }
                : null,
            ]}
          >
            {showSuggestedQuestions && !isKeyboardVisible ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestedQuestionsScroll}
                contentContainerStyle={[
                  styles.suggestedQuestionsContent,
                  {
                    paddingHorizontal: spacing[4],
                    paddingTop: spacing[3],
                    paddingBottom: spacing[2],
                  },
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {ASK_AI_SUGGESTED_QUESTIONS.map((question) => (
                  <TouchableOpacity
                    key={question}
                    activeOpacity={0.7}
                    onPress={() => handleSuggestedQuestion(question)}
                    style={[
                      styles.suggestedQuestionChip,
                      {
                        borderColor: isDark
                          ? AI_CHAT_COLORS.SUGGESTED_QUESTION_BORDER_DARK
                          : colors.border0,
                        backgroundColor: isDark
                          ? AI_CHAT_COLORS.SUGGESTED_QUESTION_BG_DARK
                          : colors.surfacePrimary,
                        marginRight: spacing[2],
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      size="small"
                      style={{ color: colors.textPrimary }}
                    >
                      {question}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <View
              style={[
                styles.bottomComposer,
                {
                  backgroundColor: colors.surfacePrimary,
                  borderTopColor: colors.border0,
                  paddingTop: COMPOSER_PADDING_TOP,
                  paddingHorizontal: spacing[4],
                  paddingBottom: isKeyboardVisible
                    ? COMPOSER_PADDING_BOTTOM_KEYBOARD
                    : Math.max(
                        insets.bottom + spacing[2],
                        COMPOSER_PADDING_BOTTOM_IDLE
                      ),
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputPill,
                    {
                      borderColor: colors.border0,
                      backgroundColor: colors.surfacePrimary,
                    },
                  ]}
                >
                  <View style={styles.mediaIconRow}>
                    <TouchableOpacity
                      onPress={handleUploadPress}
                      style={styles.imageButton}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      disabled={isImageProcessing || isAiTyping}
                    >
                      <UploadIconSvg
                        width={MEDIA_ICON_SIZE}
                        height={MEDIA_ICON_SIZE}
                        color={isDark ? UI_COLORS.WHITE : UI_COLORS.BLACK}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCameraPress}
                      style={styles.imageButton}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      disabled={isImageProcessing || isAiTyping}
                    >
                      <AskAiCameraIconSvg
                        width={MEDIA_ICON_SIZE}
                        height={MEDIA_ICON_SIZE}
                        color={isDark ? UI_COLORS.WHITE : UI_COLORS.BLACK}
                      />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Hello, how I can help you?"
                    placeholderTextColor={colors.textTertiary}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={500}
                    autoCorrect={false}
                    spellCheck={false}
                    textAlignVertical="center"
                    {...(Platform.OS === "android"
                      ? { includeFontPadding: false }
                      : {})}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSend}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: colors.surfaceBrand,
                      opacity: inputText.trim() ? 1 : 0.45,
                    },
                  ]}
                  disabled={!inputText.trim()}
                  activeOpacity={0.7}
                >
                  <AskAiSendIconSvg width={SEND_ICON_SIZE} height={SEND_ICON_SIZE} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <LimitReachedBottomSheet
        visible={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        onUpgrade={() => {
          setShowLimitSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="aiChat"
      />

      <GalleryAccessPopup
        visible={showGalleryPopup}
        onClose={() => setShowGalleryPopup(false)}
        onAccessGranted={() => {
          setShowGalleryPopup(false);
          openGalleryAndSendImage();
        }}
        photosBlocked={photosBlocked}
        onBlockedChange={setPhotosBlocked}
      />
    </>
  );
};

/**
 * Typing Indicator Component
 * Shows animated dots while AI is processing
 */
interface TypingIndicatorProps {
  theme: any;
  styles: any;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ theme, styles }) => {
  const colors = theme.colors;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ];

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [dot1, dot2, dot3]);

  const opacity1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const opacity2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const opacity3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={styles.iconContainer}>
        <AppImage
          source={Images.aiChatIcon}
          style={styles.aiIcon}
          resizeMode="contain"
        />
      </View>
      <View
        style={[
          styles.messageBubble,
          styles.aiBubble,
          styles.inclinedLeft,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <View style={styles.typingIndicator}>
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary, opacity: opacity1 },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary, opacity: opacity2 },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary, opacity: opacity3 },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: "relative",
    },
    screenContent: {
      flex: 1,
      zIndex: 1,
    },
    messagesListContainer: {
      flex: 1,
      minHeight: 0,
    },
    bottomArea: {
      flexShrink: 0,
    },
    bottomComposer: {
      borderTopWidth: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
    },
    messagesList: {
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
      backgroundColor: theme.colors.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
      marginTop: 2,
    },
    aiIcon: {
      width: 16,
      height: 16,
    },
    imageBubble: {
      width: 200,
      height: 150,
      borderRadius: Radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceSecondary,
      shadowColor: ACCENT_COLORS.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    plantImage: {
      width: "100%",
      height: "100%",
    },
    suggestedQuestionsScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    suggestedQuestionsContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    suggestedQuestionChip: {
      borderRadius: SUGGESTED_CHIP_BORDER_RADIUS,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    inputPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      minHeight: INPUT_BAR_HEIGHT,
      borderWidth: 1,
      borderRadius: INPUT_BORDER_RADIUS,
      paddingHorizontal: 8,
      paddingVertical: 10,
      gap: 8,
    },
    mediaIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    imageButton: {
      height: 32,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      maxHeight: 100,
      fontSize: 16,
      lineHeight: 22,
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
    },
    sendButton: {
      width: SEND_BUTTON_SIZE,
      height: SEND_BUTTON_SIZE,
      borderRadius: INPUT_BORDER_RADIUS,
      alignItems: "center",
      justifyContent: "center",
    },
    typingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });
