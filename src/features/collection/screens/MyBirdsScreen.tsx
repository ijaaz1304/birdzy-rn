import { getResponsiveGridColumns } from "@/utils/responsiveLayout";
import { useWindowDimensions } from "react-native";
/**
 * My Mushrooms Screen
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../hooks/useTheme";
import { Text, NavBackIcon } from "../../../atoms";
import { BirdCard } from "../../../organisms";
import { useFeatureConfig } from "../../../config/context";
import { screenStyles } from "../../../styles/common";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";
import { CardSkeleton } from "../../../components/skeleton";
import {
  getDisplayName,
  getMushroomDisplayScientificFromFields,
} from "../../../utils/mushroomDisplayUtils";
import { getSpecimenDisplayImageUrls } from "../collection.utils";
import { CollectionStackParamList } from "../../../navigation/types";

import { spacing } from "../../../design-system/spacing";

type MyBirdsScreenNavigationProp = NativeStackNavigationProp<
  CollectionStackParamList,
  "MyBirds"
>;

export const MyBirdsScreen: React.FC = () => {
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const gridColumns = getResponsiveGridColumns(windowWidth, fontScale);
  const theme = useTheme();
  const navigation = useNavigation<MyBirdsScreenNavigationProp>();
  const collectionConfig = useFeatureConfig("collection");
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch identified minerals from API
  useEffect(() => {
    const loadIdentified = async () => {
      try {
        setIsLoading(true);
        const response = await mushroomSpecimenService.fetchAllSpecimens(
          { isIdentified: [true] },
          { pageNo: 0, pageSize: 50 }
        );
        const mappedItems = response.data.map((specimen) => ({
          id: specimen.specimenId,
          name: getDisplayName(specimen),
          scientificName: getMushroomDisplayScientificFromFields(specimen),
          image: (() => {
            const urls = getSpecimenDisplayImageUrls(specimen);
            return urls[0] ? { uri: urls[0] } : undefined;
          })(),
        }));
        setItems(mappedItems);
      } catch (error) {
        console.error("Error loading identified minerals:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadIdentified();
  }, []);

  return (
    <SafeAreaView
      style={[
        screenStyles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
      edges={["top"]}
    >
      <View style={[screenStyles.header, styles.headerPadding]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <NavBackIcon color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="title" size="medium" weight="semibold">
          {collectionConfig.myItems.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <CardSkeleton height={200} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.id ?? `item-${index}`}
          numColumns={gridColumns}
          key={`collection-grid-${gridColumns}`}
          columnWrapperStyle={
            gridColumns > 1 ? styles.columnWrapper : undefined
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.itemCardWrapper,
                gridColumns === 1 && { width: "100%" },
              ]}
            >
              <BirdCard
                id={item.id}
                name={item.name}
                scientificName={item.scientificName}
                image={item.image}
                variant="compact"
                onPress={() => {
                  navigation.navigate("BirdDetails", {
                    mushroomId: item.id,
                    source: "collection",
                    collectionName: "Identified",
                    idType: "specimen",
                    specimenId: item.id,
                  });
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="diamond-outline"
                size={64}
                color={theme.colors.textTertiary}
              />
              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={styles.emptyText}
              >
                {collectionConfig.myItems.emptySubtitle}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerPadding: {
    padding: spacing[4],
  },
  placeholder: {
    width: 24,
  },
  list: {
    padding: spacing[4],
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemCardWrapper: {
    width: "48%",
    flex: 0,
    maxWidth: "48%",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing[4],
    gap: 8,
  },
  skeletonItem: {
    width: "48%",
    marginBottom: 8,
  },
});
