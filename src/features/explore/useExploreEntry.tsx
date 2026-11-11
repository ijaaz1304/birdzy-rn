/**
 * useExploreEntry
 *
 * One way into the Explore map for any screen that has an entry point (Home
 * banner, Catalogue button and banner). Opening Explore first asks for
 * location access; the screen renders `popups` once and the hook handles the
 * rest: "Enable Location Access", "manage settings", the custom-location
 * sheet, and finally navigating to the map.
 */

import React, { useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { LocationPermissionPopup } from "../../molecules/Modal/LocationPermissionPopup";
import { LocationManageAccessPopup } from "../../molecules/Modal/LocationManageAccessPopup";
import { ChangeLocationBottomSheet } from "../../molecules/Modal/ChangeLocationBottomSheet";
import { useExploreLocationToggleFlow } from "./useExploreLocationToggleFlow";

export type ExploreEntryTab = "growingNow" | "yearRound";

export function useExploreEntry() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const location = useExploreLocationToggleFlow();
  const entryTab = useRef<ExploreEntryTab>("growingNow");
  const { requestExploreAccess } = location;

  const goToMap = useCallback(
    (initialLocation?: { lat: number; lng: number; label: string }) => {
      navigation.navigate("ExploreStack", {
        screen: "ExploreMap",
        params: {
          initialTab: entryTab.current,
          ...(initialLocation ? { initialLocation } : {}),
        },
      });
    },
    [navigation]
  );

  /** Opens the map once location access is in place; otherwise a popup does the asking. */
  const openExplore = useCallback(
    async (tab: ExploreEntryTab = "growingNow") => {
      entryTab.current = tab;
      if ((await requestExploreAccess()) === "granted") goToMap();
      // else: requestExploreAccess already opened the relevant popup, and
      // the handlers below navigate when the person finishes it.
    },
    [requestExploreAccess, goToMap]
  );

  const popups = (
    <>
      <LocationPermissionPopup
        visible={location.showEnablePopup}
        onClose={() => location.setShowEnablePopup(false)}
        loading={location.loading}
        onAllowLocation={async () => {
          if (await location.handleAllowLocation()) goToMap();
        }}
        onCustomLocation={location.openAddLocation}
      />
      <LocationManageAccessPopup
        visible={location.showManagePopup}
        onClose={() => location.setShowManagePopup(false)}
        onCustomLocation={location.openAddLocation}
      />
      <ChangeLocationBottomSheet
        visible={location.showAddLocationSheet}
        onClose={() => location.setShowAddLocationSheet(false)}
        variant="add"
        onConfirm={(chosen) => {
          location.setShowAddLocationSheet(false);
          goToMap({
            lat: chosen.latitude,
            lng: chosen.longitude,
            label: chosen.address,
          });
        }}
      />
    </>
  );

  return { openExplore, popups };
}
