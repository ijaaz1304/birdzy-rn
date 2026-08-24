/**
 * Remove From Collection Bottom Sheet
 * Shows collections with checkboxes to remove mineral from
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text, Button, Checkbox } from "../../atoms";
import { BottomSheet } from "../../components/bottomSheet/BottomSheet";
import { collectionService } from "../../services/collection/collection.service";
import { mushroomSpecimenService } from "../../services/specimen/mushroomSpecimen.service";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { APP_COLORS } from "../../config/colors";
import { useToast } from "../../hooks/useToast";
import { useAuthStore } from "../../features/auth/auth.store";
import { useCollectionInvalidationStore } from "../../features/collection/collectionInvalidation.store";

import { spacing } from "../../design-system/spacing";

export interface RemoveFromCollectionBottomSheetProps {
  visible: boolean;
  mushroomId: string;
  mushroomName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveFromCollectionBottomSheet: React.FC<
  RemoveFromCollectionBottomSheetProps
> = ({ visible, mushroomId, mushroomName, onClose, onSuccess }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [collections, setCollections] = useState<
    Array<{ collectionId: string; name: string; containsMineral: boolean }>
  >([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  // Fetch all collections and check which ones contain this mineral
  useEffect(() => {
    if (!visible || !user?.id) return;

    const loadCollections = async () => {
      try {
        setLoading(true);
        const response = await collectionService.fetchAllCollections({
          pageNo: 0,
          pageSize: 100,
        });

        // Check which collections contain this mineral (fetch specimens per collection; getDetails does not return specimens)
        const collectionsWithMushroom = await Promise.all(
          response.data.map(async (collection) => {
            try {
              const { data: specimens } =
                await mushroomSpecimenService.fetchAllSpecimens(
                  { _collections: [collection.collectionId] },
                  {
                    pageNo: 0,
                    pageSize: 500,
                    collectionId: collection.collectionId,
                  }
                );
              const containsMineral = (specimens || []).some(
                (s: any) =>
                  String(s._archetype ?? s.archetypeId) ===
                    String(mushroomId) ||
                  String(s.specimenId) === String(mushroomId) ||
                  String(s._id) === String(mushroomId)
              );
              return {
                collectionId: collection.collectionId,
                name: collection.name,
                containsMineral,
              };
            } catch {
              return {
                collectionId: collection.collectionId,
                name: collection.name,
                containsMineral: false,
              };
            }
          })
        );

        const filtered = collectionsWithMushroom.filter(
          (c) => c.containsMineral
        );
        setCollections(filtered);
      } catch (error) {
        console.error("Error loading collections:", error);
        showToast("Failed to load collections", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [visible, mushroomId, user?.id]);

  const toggleCollection = useCallback((collectionId: string) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  }, []);

  const handleRemove = useCallback(async () => {
    if (selectedCollections.size === 0) {
      showToast("Please select at least one collection", "warning");
      return;
    }

    try {
      setRemoving(true);

      for (const collectionId of selectedCollections) {
        try {
          const { data: specimens } =
            await mushroomSpecimenService.fetchAllSpecimens(
              { _collections: [collectionId] },
              { pageNo: 0, pageSize: 500, collectionId }
            );
          const matchingSpecimens = (specimens || []).filter(
            (s: any) =>
              String(s._archetype ?? s.archetypeId) === String(mushroomId) ||
              String(s.specimenId) === String(mushroomId) ||
              String(s._id) === String(mushroomId)
          );
          for (const specimen of matchingSpecimens) {
            const sid = specimen.specimenId ?? (specimen as { _id?: string })._id;
            if (sid) {
              try {
                await mushroomSpecimenService.deleteSpecimen(sid);
              } catch (err) {
                console.error("Error deleting specimen:", err);
              }
            }
          }
          useCollectionInvalidationStore.getState().invalidate();
        } catch (error) {
          console.error(
            `Error removing from collection ${collectionId}:`,
            error
          );
        }
      }

      showToast("Removed from selected collections", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error removing from collections:", error);
      showToast("Failed to remove from collections", "error");
    } finally {
      setRemoving(false);
    }
  }, [selectedCollections, mushroomId, onSuccess, onClose]);

  const strings = MODAL_STRINGS.bottomSheets.removeCollection;

  return (
    <BottomSheet
      visible={visible}
      heightPercent={70}
      onClose={onClose}
      enableBackdropDismiss={true}
    >
      <View style={styles.container}>
        <Text
          variant="title"
          size="large"
          weight="semibold"
          style={styles.title}
        >
          {strings.title}
        </Text>
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.subtitle}
        >
          {strings.subtitle.replace("{mushroomName}", mushroomName)}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="body" size="medium" color="textSecondary">
              Loading collections...
            </Text>
          </View>
        ) : collections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" size="medium" color="textSecondary">
              This mushroom is not in any collections
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.collectionId}
                style={[
                  styles.collectionItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => toggleCollection(collection.collectionId)}
                activeOpacity={0.7}
              >
                <Checkbox
                  checked={selectedCollections.has(collection.collectionId)}
                  onPress={() => toggleCollection(collection.collectionId)}
                />
                <Text
                  variant="body"
                  size="medium"
                  style={styles.collectionName}
                >
                  {collection.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <View style={styles.buttonWrap}>
            <Button
              title={strings.cancelButton}
              variant="outline"
              size="large"
              onPress={onClose}
              style={[
                styles.equalButton,
                {
                  borderColor:
                    theme.mode === "dark"
                      ? APP_COLORS.cancelSecondaryBorderDark
                      : APP_COLORS.cancelSecondaryBorderLight,
                },
              ]}
            />
          </View>
          <View style={styles.buttonWrap}>
            <Button
              title={strings.removeButton}
              variant="primary"
              size="large"
              onPress={handleRemove}
              loading={removing}
              disabled={selectedCollections.size === 0 || loading}
              style={styles.equalButton}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  list: {
    flex: 1,
    marginBottom: 24,
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  collectionName: {
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonWrap: {
    flex: 1,
    minWidth: 0,
  },
  equalButton: {
    width: "100%",
  },
});
