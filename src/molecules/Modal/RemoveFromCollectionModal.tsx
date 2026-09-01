/**
 * Remove From Collection Modal (Popup)
 * List layout: thumbnail, name, item count, per-row Remove — matches design spec.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, ImageSourcePropType, InteractionManager, Platform } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";
import { normalizeImageUrls } from "../../utils/mushroomCardUtils";
import { getMushroomImageUrlFromMatch } from "../../config/mushroomImageUrls.config";
import { APP_COLORS } from "../../config/colors";
import { SUBSCRIPTION_COLORS } from "../../constants/colorConstants";
import { Text, Button } from "../../atoms";
import { collectionService } from "../../services/collection/collection.service";
import { useToast } from "../../hooks/useToast";
import { useAuthStore } from "../../features/auth/auth.store";
import { ADD_TO_COLLECTION_IDS } from "../../constants/appConstants";
import { coreApi } from "../../services/api/features/core.api";
import { archetypeService } from "../../services/archetype/archetype.service";
import { mushroomSpecimenService } from "../../services/specimen/mushroomSpecimen.service";
import { useWishlistInvalidationStore } from "../../features/collection/wishlistInvalidation.store";
import { useCollectionInvalidationStore } from "../../features/collection/collectionInvalidation.store";
import { useBirdsStore } from "../../features/catalogue/birds.store";
import { Radius } from "../../design";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

type CollectionRow = {
  collectionId: string;
  name: string;
  containsMineral: boolean;
  /** From API when available */
  specimenCount?: number;
  /** Same resolution as Identified list (specimen imageUrls → Mindat/Firebase URLs) */
  thumbnailUri?: string;
  /** Preferred list thumbnail from collection API */
  representImage?: string;
  imageUrl?: string;
};

/** Match CollectionDetailsScreen mapSpecimenToMushroom image resolution */
function resolveSpecimenListThumbnailUri(specimen: any): string | undefined {
  if (!specimen || typeof specimen !== "object") return undefined;
  const canonicalName = specimen.canonicalName ?? specimen.scientificName;
  const rawUris = normalizeImageUrls(specimen.imageUrls);
  if (rawUris.length === 0) return undefined;
  const resolvedUris = rawUris.map((uri: string) =>
    uri.startsWith("http://") || uri.startsWith("https://")
      ? uri
      : getMushroomImageUrlFromMatch(
          typeof canonicalName === "string" ? canonicalName : undefined,
          uri
        ) ?? uri
  );
  return resolvedUris[0];
}

function collectionThumbSource(row: CollectionRow): ImageSourcePropType {
  const u = (row.thumbnailUri ?? row.representImage ?? row.imageUrl)?.trim();
  if (
    u &&
    (u.startsWith("http") || u.startsWith("https") || u.startsWith("file"))
  ) {
    return { uri: u };
  }
  return Images.card_image_placeholder;
}

/** Resolve list/detail specimen id for DELETE /core/specimen/delete/:id */
function getSpecimenIdFromListItem(s: unknown): string | undefined {
  if (!s || typeof s !== "object") return undefined;
  const o = s as Record<string, unknown>;
  const sid = o.specimenId ?? o._id ?? o.id;
  if (sid == null) return undefined;
  const str = String(sid).trim();
  return str === "" ? undefined : str;
}

export interface RemoveFromCollectionModalProps {
  visible: boolean;
  /** MushroomArchetype (mineral) ID for matching Identified/Wishlist and specimens by _archetype */
  mushroomId?: string | null;
  /** When viewing from a specimen, pass so we can find collections by specimenId and resolve _archetype if mushroomId missing */
  specimenId?: string | null;
  mushroomName: string;
  onClose: () => void;
  onSuccess?: () => void;
  initialCollectionName?: string;
  /** When API list is empty (e.g. just added), seed one removable row (real id or __identified__ / __wishlist__) */
  initialCollectionId?: string;
}

export const RemoveFromCollectionModal: React.FC<
  RemoveFromCollectionModalProps
> = ({
  visible,
  mushroomId,
  specimenId,
  mushroomName,
  onClose,
  onSuccess,
  initialCollectionName,
  initialCollectionId,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const isDark = useIsDark();
  const modalBg = isDark
    ? APP_COLORS.surfaceDark
    : APP_COLORS.modalTextOnPrimary;
  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [resolvedArchetypeId, setResolvedArchetypeId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  /** Collections to remove after user confirms (from a single row's Remove) */
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string> | null>(
    null
  );

  // Fetch all collections and check which ones contain this mineral (including virtual Identified/Wishlist)
  useEffect(() => {
    if (!visible || !user?.id || (!mushroomId && !specimenId)) return;

    const loadCollections = async () => {
      try {
        setLoading(true);
        let archetypeId: string | null = mushroomId ?? null;
        if (!archetypeId && specimenId) {
          try {
            const spec = await mushroomSpecimenService.getSpecimenDetails(
              specimenId
            );
            const s = spec as any;
            archetypeId =
              s._archetype ?? s.archetypeId ?? s.archetype_id ?? null;
          } catch {
            // use specimenId only for matching below
          }
        }

        const matchSpecimen = (s: any) => {
          const sid = String(s.specimenId ?? s._id ?? "");
          const arch = String(
            s._archetype ?? s.archetypeId ?? s.archetype_id ?? ""
          );
          return (
            (archetypeId && arch === String(archetypeId)) ||
            (specimenId && sid === String(specimenId)) ||
            (mushroomId && sid === String(mushroomId)) ||
            (mushroomId && arch === String(mushroomId))
          );
        };

        let identifiedListThumb: string | undefined;
        let wishlistListThumb: string | undefined;
        if (archetypeId) {
          try {
            const { data: idSpecs } =
              await mushroomSpecimenService.fetchAllSpecimens(
                { isIdentified: [true] },
                { pageNo: 0, pageSize: 500 }
              );
            const idMatch = (idSpecs || []).find(matchSpecimen);
            if (idMatch) {
              identifiedListThumb = resolveSpecimenListThumbnailUri(idMatch);
            }
          } catch {
            // ignore
          }
          try {
            const { data: wlSpecs } =
              await mushroomSpecimenService.fetchAllSpecimens(
                { isWishlisted: [true] },
                { pageNo: 0, pageSize: 500 }
              );
            const wlMatch = (wlSpecs || []).find(matchSpecimen);
            if (wlMatch) {
              wishlistListThumb = resolveSpecimenListThumbnailUri(wlMatch);
            }
          } catch {
            // ignore
          }
        }

        const virtual: CollectionRow[] = [];

        if (archetypeId) {
          try {
            const archetypeRes = await coreApi.getArchetypeDetails(archetypeId);
            const archetype = archetypeRes?.data ?? archetypeRes;
            if (archetype?.isIdentified) {
              virtual.push({
                collectionId: ADD_TO_COLLECTION_IDS.IDENTIFIED,
                name: "Identified",
                containsMineral: true,
                thumbnailUri: identifiedListThumb,
              });
            }
            if (archetype?.isWishlisted) {
              virtual.push({
                collectionId: ADD_TO_COLLECTION_IDS.WISHLIST,
                name: "Wishlist",
                containsMineral: true,
                thumbnailUri: wishlistListThumb,
              });
            }
          } catch {
            // MushroomArchetype might not exist or not be in identified/wishlist
          }
        }

        const response = await collectionService.fetchAllCollections({
          pageNo: 0,
          pageSize: 100,
        });

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
              const containsMineral = (specimens || []).some(matchSpecimen);
              const match = (specimens || []).find(matchSpecimen);
              const thumbnailUri = match
                ? resolveSpecimenListThumbnailUri(match)
                : undefined;
              return {
                collectionId: collection.collectionId,
                name: collection.name,
                containsMineral,
                specimenCount: collection.specimenCount,
                thumbnailUri,
                representImage: collection.representImage,
                imageUrl: collection.imageUrl,
              };
            } catch {
              return {
                collectionId: collection.collectionId,
                name: collection.name,
                containsMineral: false,
                specimenCount: collection.specimenCount,
                representImage: collection.representImage,
                imageUrl: collection.imageUrl,
              };
            }
          })
        );

        let filtered = [
          ...virtual,
          ...collectionsWithMushroom.filter((c) => c.containsMineral),
        ];

        // Virtual Identified/Wishlist use __identified__ / __wishlist__. The same specimen often
        // also appears under a real collection with name "Identified" or "Wishlist" — avoid two rows.
        const hasVirtualIdentified = virtual.some(
          (v) => v.collectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED
        );
        const hasVirtualWishlist = virtual.some(
          (v) => v.collectionId === ADD_TO_COLLECTION_IDS.WISHLIST
        );
        filtered = filtered.filter((c) => {
          const n = c.name.trim().toLowerCase();
          if (
            hasVirtualIdentified &&
            c.collectionId !== ADD_TO_COLLECTION_IDS.IDENTIFIED &&
            n === "identified"
          ) {
            return false;
          }
          if (
            hasVirtualWishlist &&
            c.collectionId !== ADD_TO_COLLECTION_IDS.WISHLIST &&
            n === "wishlist"
          ) {
            return false;
          }
          return true;
        });

        const seenIds = new Set<string>();
        filtered = filtered.filter((c) => {
          if (seenIds.has(c.collectionId)) return false;
          seenIds.add(c.collectionId);
          return true;
        });

        // Session hint or stale API: list can be empty briefly after add from identification
        if (filtered.length === 0 && initialCollectionId) {
          let seedName = initialCollectionName;
          let seedCount: number | undefined;
          let seedRepresent: string | undefined;
          let seedImageUrl: string | undefined;
          let seedThumb: string | undefined;
          if (!seedName) {
            if (initialCollectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED) {
              seedName = "Identified";
            } else if (initialCollectionId === ADD_TO_COLLECTION_IDS.WISHLIST) {
              seedName = "Wishlist";
            } else {
              try {
                const details = await collectionService.getCollectionDetails(
                  initialCollectionId
                );
                seedName = details?.name ?? "Collection";
                seedCount = details?.specimenCount;
                seedRepresent = details?.representImage;
                seedImageUrl = details?.imageUrl;
              } catch {
                seedName = "Collection";
              }
            }
          }
          if (specimenId) {
            try {
              const spec = await mushroomSpecimenService.getSpecimenDetails(
                specimenId
              );
              seedThumb = resolveSpecimenListThumbnailUri(spec);
            } catch {
              // ignore
            }
          }
          filtered = [
            ...filtered,
            {
              collectionId: initialCollectionId,
              name: seedName ?? "Collection",
              containsMineral: true,
              specimenCount: seedCount,
              thumbnailUri: seedThumb,
              representImage: seedRepresent,
              imageUrl: seedImageUrl,
            },
          ];
        }

        setCollections(filtered);
        setResolvedArchetypeId(archetypeId);
        if (filtered.length === 1) {
          setPendingRemoveIds(new Set([filtered[0].collectionId]));
          setShowConfirm(true);
        }
      } catch (error) {
        console.error("Error loading collections:", error);
        showToast("Failed to load collections", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [
    visible,
    mushroomId,
    specimenId,
    user?.id,
    initialCollectionId,
    initialCollectionName,
  ]);

  useEffect(() => {
    if (!visible) {
      setPendingRemoveIds(null);
      setShowConfirm(false);
      setCollections([]);
      setLoading(true);
    }
  }, [visible]);

  const handleRowRemovePress = (collectionId: string) => {
    setPendingRemoveIds(new Set([collectionId]));
    setShowConfirm(true);
  };

  const dismissConfirm = () => {
    setShowConfirm(false);
    setPendingRemoveIds(null);
    if (collections.length === 1) {
      onClose();
    }
  };

  const confirmRemove = async () => {
    try {
      setRemoving(true);
      setShowConfirm(false);

      const selectedCollections = pendingRemoveIds;
      if (!selectedCollections || selectedCollections.size === 0) {
        setRemoving(false);
        return;
      }

      const archetypeIdToUse = resolvedArchetypeId ?? mushroomId ?? null;
      const hasNonWishlistSelection = [...selectedCollections].some(
        (id) => id !== ADD_TO_COLLECTION_IDS.WISHLIST
      );
      const wantsIdentifiedRemoval = selectedCollections.has(
        ADD_TO_COLLECTION_IDS.IDENTIFIED
      );
      const normId = (v: unknown) => (v == null ? "" : String(v).trim());

      /**
       * DELETE /core/specimen/delete/:id — one call per specimen id.
       * When the details screen passes specimenId, always queue it for any non-wishlist removal
       * (fetch-based matching often missed the id and never called the API).
       */
      const specimenIdsToDelete = new Set<string>();
      let identifiedSpecimenQueued = false;

      if (specimenId && hasNonWishlistSelection) {
        specimenIdsToDelete.add(String(specimenId));
        if (wantsIdentifiedRemoval) {
          identifiedSpecimenQueued = true;
        }
      }

      for (const collectionId of selectedCollections) {
        try {
          if (collectionId === ADD_TO_COLLECTION_IDS.WISHLIST) {
            if (archetypeIdToUse) {
              await archetypeService.removeWishlistArchetype(archetypeIdToUse);
              useBirdsStore.getState().removeFavorite(archetypeIdToUse);
            }
            useWishlistInvalidationStore.getState().invalidate();
            continue;
          }

          if (collectionId === ADD_TO_COLLECTION_IDS.IDENTIFIED) {
            if (!specimenId) {
              const { data: identifiedSpecimens } =
                await mushroomSpecimenService.fetchAllSpecimens(
                  { isIdentified: [true] },
                  { pageNo: 0, pageSize: 500 }
                );
              const aid = normId(archetypeIdToUse);
              const mid = normId(mushroomId);
              const match = (identifiedSpecimens || []).find((s: any) => {
                const arch = normId(
                  s._archetype ?? s.archetypeId ?? s.archetype_id
                );
                const sid = normId(s.specimenId ?? s._id ?? s.id);
                if (aid && arch && arch === aid) return true;
                if (mid && arch && arch === mid) return true;
                if (mid && sid && sid === mid) return true;
                return false;
              });
              const sid = getSpecimenIdFromListItem(match);
              if (sid) {
                specimenIdsToDelete.add(sid);
                identifiedSpecimenQueued = true;
              }
            }
            useCollectionInvalidationStore.getState().invalidate();
            continue;
          }

          const alreadyHaveRouteSpecimen =
            specimenId && specimenIdsToDelete.has(String(specimenId));

          if (!alreadyHaveRouteSpecimen) {
            const { data: specimens } =
              await mushroomSpecimenService.fetchAllSpecimens(
                { _collections: [collectionId] },
                { pageNo: 0, pageSize: 500, collectionId }
              );
            const matchingSpecimens = (specimens || []).filter(
              (s: any) =>
                (archetypeIdToUse &&
                  String(s._archetype ?? s.archetypeId) ===
                    String(archetypeIdToUse)) ||
                (specimenId &&
                  String(s.specimenId ?? s._id ?? s.id) ===
                    String(specimenId)) ||
                (mushroomId &&
                  (String(s.specimenId ?? s._id ?? s.id) ===
                    String(mushroomId) ||
                    String(s._archetype ?? s.archetypeId) ===
                      String(mushroomId)))
            );
            for (const specimen of matchingSpecimens) {
              const sid = getSpecimenIdFromListItem(specimen);
              if (sid) specimenIdsToDelete.add(sid);
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

      if (wantsIdentifiedRemoval && !identifiedSpecimenQueued) {
        showToast(
          "Could not find your Identified specimen to remove. Try again in a moment.",
          "error"
        );
        if (collections.length === 1) {
          setShowConfirm(true);
        }
        return;
      }

      let deleteFailures = 0;
      for (const sid of specimenIdsToDelete) {
        try {
          await mushroomSpecimenService.deleteSpecimen(sid);
        } catch (err) {
          deleteFailures += 1;
          console.error("Error deleting specimen:", sid, err);
        }
      }

      if (
        specimenIdsToDelete.size > 0 &&
        deleteFailures === specimenIdsToDelete.size
      ) {
        showToast("Could not remove specimen. Please try again.", "error");
        if (collections.length === 1) {
          setShowConfirm(true);
        }
        return;
      }

      showToast("Removed from selected collections", "success");
      setPendingRemoveIds(null);
      // Close modal first; defer navigation in onSuccess until after the native Modal
      // dismisses — avoids a stuck invisible overlay blocking touches (e.g. CollectionMain).
      onClose();
      const dismissMs = Platform.OS === "android" ? 320 : 220;
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          // Let native Modal fully dismiss before navigation (avoid ghost overlay / empty stack).
          setTimeout(() => {
            onSuccess?.();
          }, dismissMs);
        });
      });
    } catch (error) {
      console.error("Error removing from collections:", error);
      showToast("Failed to remove from collections", "error");
      if (collections.length === 1) {
        setShowConfirm(true);
      }
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Modal
        visible={
          visible && !showConfirm && !removing && !loading && collections.length > 1
        }
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: APP_COLORS.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: modalBg,
                borderRadius: radius.lg,
              },
              getPopupChromeStyle(theme),
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  top: spacing[3],
                  right: spacing[3],
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon isDark={theme.mode === "dark"} style={styles.closeIcon} />
            </TouchableOpacity>

            <Text
              variant="headline"
              size="medium"
              weight="bold"
              style={styles.modalTitle}
            >
              Remove collection
            </Text>

            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.instruction}
            >
              Please select the collections you want to remove this bird
              from.
            </Text>

            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              accessibilityLabel={`Collections containing ${mushroomName}`}
            >
                {collections.map((collection) => (
                  <View
                    key={collection.collectionId}
                    style={[
                      styles.collectionRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <AppImage
                      source={collectionThumbSource(collection)}
                      style={[
                        styles.thumbnail,
                        { backgroundColor: colors.surfaceVariant },
                      ]}
                      resizeMode="cover"
                    />
                    <View style={styles.rowTextBlock}>
                      <Text
                        variant="body"
                        size="medium"
                        weight="semibold"
                        numberOfLines={2}
                        style={{ color: colors.text }}
                      >
                        {collection.name}
                      </Text>
                      {collection.specimenCount != null ? (
                        <Text
                          variant="body"
                          size="small"
                          color="textSecondary"
                          style={styles.itemCount}
                        >
                          {`${collection.specimenCount} ${
                            collection.specimenCount === 1 ? "item" : "items"
                          }`}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleRowRemovePress(collection.collectionId)
                      }
                      disabled={removing}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.removeLinkWrap}
                    >
                      <Text
                        variant="body"
                        size="medium"
                        weight="medium"
                        style={{ color: colors.primary }}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={visible && !showConfirm && !removing && !loading && collections.length === 0}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: APP_COLORS.overlay }]}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: modalBg,
                borderRadius: radius.lg,
              },
              getPopupChromeStyle(theme),
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  top: spacing[3],
                  right: spacing[3],
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon isDark={theme.mode === "dark"} style={styles.closeIcon} />
            </TouchableOpacity>

            <Text
              variant="headline"
              size="medium"
              weight="bold"
              style={styles.modalTitle}
            >
              Remove collection
            </Text>

            <View style={styles.emptyContainer}>
              <Text variant="body" size="medium" color="textSecondary">
                This bird is not in any collections
              </Text>
              {initialCollectionName ? (
                <Text
                  variant="body"
                  size="small"
                  color="textSecondary"
                  style={styles.emptyHint}
                >
                  You may have added it to "{initialCollectionName}". If you
                  just added it, try again in a moment.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Remove Modal */}
      <Modal
        visible={showConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissConfirm}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: APP_COLORS.overlay }]}
        >
          <View
            style={[
              styles.confirmModal,
              {
                backgroundColor: modalBg,
                borderRadius: radius.lg,
              },
              getPopupChromeStyle(theme),
            ]}
          >
            <TouchableOpacity
              onPress={dismissConfirm}
              style={[
                styles.closeBtn,
                {
                  top: spacing[3],
                  right: spacing[3],
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <CloseIcon isDark={theme.mode === "dark"} style={styles.closeIcon} />
            </TouchableOpacity>

            <AppImage
              source={isDark ? Images.trashDark : Images.trashLight}
              style={styles.confirmIcon}
              resizeMode="contain"
              preferRNImage
            />
            <Text
              variant="headline"
              size="medium"
              weight="bold"
              style={styles.confirmTitle}
            >
              Do you want to remove from your Collection?
            </Text>
            <View style={styles.confirmActions}>
              <View style={styles.buttonWrap}>
                <Button
                  title="Yes, Remove"
                  variant="primary"
                  size="medium"
                  onPress={confirmRemove}
                  loading={removing}
                  style={[styles.equalButton, { backgroundColor: ctaBg }]}
                />
              </View>
              <View style={styles.buttonWrap}>
                <Button
                  title="No, Thanks"
                  variant="ghost"
                  size="medium"
                  onPress={dismissConfirm}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark
                      ? APP_COLORS.cancelSecondaryBorderDark
                      : APP_COLORS.cancelSecondaryBorderLight,
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "72%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    zIndex: 10,
    width: 36,
    height: 36,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.md,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  modalTitle: {
    marginBottom: 8,
    paddingRight: 36,
  },
  instruction: {
    marginBottom: 12,
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyHint: {
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  list: {
    maxHeight: 280,
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    overflow: "hidden",
  },
  rowTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  itemCount: {
    marginTop: 4,
  },
  removeLinkWrap: {
    paddingLeft: 8,
    justifyContent: "center",
  },
  buttonWrap: {
    width: "100%",
  },
  equalButton: {
    width: "100%",
  },
  confirmModal: {
    width: "100%",
    maxWidth: 320,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 44,
    position: "relative",
    overflow: "hidden",
  },
  confirmIcon: {
    width: 48,
    height: 48,
    alignSelf: "center",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  confirmTitle: {
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  confirmText: {
    marginBottom: 16,
    textAlign: "center",
  },
  confirmActions: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
});
