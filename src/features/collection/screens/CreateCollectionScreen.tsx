/**
 * Create Collection Screen
 */

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CollectionStackParamList } from "../../../navigation/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../hooks/useTheme";
import { Text } from "../../../atoms";
import { Input } from "../../../molecules/Input/Input";
import { PrimaryButton } from "../../../atoms/PrimaryButton/PrimaryButton";
import { collectionService } from "../../../services/collection/collection.service";
import { useToast } from "../../../hooks";
import { LimitReachedBottomSheet } from "../../../molecules/Modal";
import { isPaywallOrLimitError } from "../../../services/api/errors";
import { shouldShowCollectionLimitPaywall } from "../../../services/session/collectionLimit.service";
import { navigateToSubscriptionMain } from "../../../utils/navigation";

import { spacing } from "../../../design-system/spacing";

export const CreateCollectionScreen: React.FC = () => {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<CollectionStackParamList>>();
  const { showToast } = useToast();
  const [collectionName, setCollectionName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLimitSheet, setShowLimitSheet] = useState(false);

  const handleCreate = async () => {
    const name = collectionName.trim();
    if (!name) {
      showToast("Please enter a collection name", "error");
      return;
    }
    setLoading(true);
    try {
      const newCollection = await collectionService.addCollection({
        name,
        description: description.trim() || undefined,
      });
      showToast("Collection created", "success");
      // Navigate to Collection tab and open the new collection (so user stays in Collection, not Home)
      navigation.reset({
        index: 1,
        routes: [
          { name: "CollectionMain", params: {} },
          {
            name: "CollectionDetails",
            params: {
              collectionId: newCollection.collectionId,
              collectionName: newCollection.name,
            },
          },
        ],
      });
    } catch (e: unknown) {
      if (isPaywallOrLimitError(e)) {
        if (shouldShowCollectionLimitPaywall()) {
          setShowLimitSheet(true);
        } else {
          showToast(
            "Couldn't create collection. Please try again in a moment.",
            "error"
          );
        }
        return;
      }
      showToast(
        e instanceof Error ? e.message : "Failed to create collection",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text
          variant="title"
          size="medium"
          weight="semibold"
          style={styles.title}
        >
          Create Collection
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { top: -8 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name="close"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Input
          placeholder="Collection name"
          value={collectionName}
          onChangeText={setCollectionName}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        <PrimaryButton
          title="Create Collection"
          onPress={handleCreate}
          disabled={loading}
        />
      </ScrollView>

      <LimitReachedBottomSheet
        visible={showLimitSheet}
        onClose={() => setShowLimitSheet(false)}
        onUpgrade={() => {
          setShowLimitSheet(false);
          navigateToSubscriptionMain();
        }}
        limitType="collection"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[4],
    position: "relative",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[4],
  },
});
