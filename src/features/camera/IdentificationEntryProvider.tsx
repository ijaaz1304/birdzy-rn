/**
 * Home-screen identification permission flow (location + camera popups).
 * Location popups render here once — shared store, same flow everywhere.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CameraPermissionPopup,
  ChangeLocationBottomSheet,
  LocationManageAccessPopup,
  LocationPermissionPopup,
} from "../../molecules/Modal";
import { RootStackParamList } from "../../navigation/types";
import {
  checkCameraPermission,
  openDeviceSettings,
  requestCameraPermission,
} from "../../services/permissions";
import { shouldShowIdentificationLocationGate } from "./locationToggle.helpers";
import { useIdentificationLocationStore } from "./identificationLocation.store";
import { useLocationPermissionUiStore } from "./locationPermissionUi.store";
import { useLocationToggleFlow } from "./useLocationToggleFlow";
import { useIdentificationEntryStore } from "./identificationEntry.store";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type IdentificationEntryContextValue = {
  startIdentificationEntry: () => void;
};

const IdentificationEntryContext =
  createContext<IdentificationEntryContextValue | null>(null);

export function useIdentificationEntry(): IdentificationEntryContextValue {
  const ctx = useContext(IdentificationEntryContext);
  if (!ctx) {
    throw new Error(
      "useIdentificationEntry must be used within IdentificationEntryProvider"
    );
  }
  return ctx;
}

export const IdentificationEntryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const navigation = useNavigation<RootNavigationProp>();
  const {
    locationLabel,
    applyManualLocation,
    showManagePopup,
    setShowManagePopup,
    showEnableLocationPopup,
    setShowEnableLocationPopup,
    showChangeLocationSheet,
    setShowChangeLocationSheet,
    changeLocationVariant,
    handleManagePopupCustomLocation,
    openCustomLocationSheet,
    handleEnableLocationRequest,
    locationRequestLoading,
    promptForLocation,
  } = useLocationToggleFlow();

  const awaitingNative = useLocationPermissionUiStore((s) => s.awaitingNative);

  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const flowActiveRef = useRef(false);
  const setCameraPermissionGranted = useIdentificationEntryStore(
    (s) => s.setCameraPermissionGranted
  );

  useEffect(() => {
    void checkCameraPermission().then((result) => {
      setCameraPermissionGranted(result.granted);
    });
  }, [setCameraPermissionGranted]);

  const navigateToCamera = useCallback(() => {
    flowActiveRef.current = false;
    navigation.navigate("MainTabs", {
      screen: "Camera",
      params: { screen: "CameraMain" },
    });
  }, [navigation]);

  const proceedAfterLocationResolved = useCallback(async () => {
    const camera = await checkCameraPermission();
    setCameraPermissionGranted(camera.granted);
    if (camera.granted) {
      navigateToCamera();
      return;
    }
    setCameraBlocked(!!camera.blocked);
    setShowCameraPopup(true);
  }, [navigateToCamera, setCameraPermissionGranted]);

  const startIdentificationEntry = useCallback(() => {
    flowActiveRef.current = true;

    if (shouldShowIdentificationLocationGate()) {
      void promptForLocation();
      return;
    }

    void proceedAfterLocationResolved();
  }, [proceedAfterLocationResolved, promptForLocation]);

  useEffect(() => {
    useIdentificationEntryStore
      .getState()
      .setStartEntryHandler(startIdentificationEntry);
    return () => {
      useIdentificationEntryStore.getState().setStartEntryHandler(null);
    };
  }, [startIdentificationEntry]);

  const handleAllowLocation = useCallback(() => {
    void (async () => {
      await handleEnableLocationRequest();

      if (!flowActiveRef.current) return;

      const granted =
        useIdentificationLocationStore.getState().permissionGranted;
      const manageOpen =
        useLocationPermissionUiStore.getState().showManagePopup;

      if (granted) {
        void proceedAfterLocationResolved();
      } else if (!manageOpen) {
        // First native denial — continue identify without location
        void proceedAfterLocationResolved();
      }
    })();
  }, [handleEnableLocationRequest, proceedAfterLocationResolved]);

  const handleLocationPopupClose = useCallback(() => {
    setShowEnableLocationPopup(false);
    if (!flowActiveRef.current) return;
    void proceedAfterLocationResolved();
  }, [proceedAfterLocationResolved, setShowEnableLocationPopup]);

  const handleCustomLocation = useCallback(() => {
    setShowEnableLocationPopup(false);
    openCustomLocationSheet();
  }, [openCustomLocationSheet, setShowEnableLocationPopup]);

  const handleAllowCamera = useCallback(() => {
    if (cameraBlocked) {
      void openDeviceSettings();
      return;
    }

    setCameraLoading(true);
    void (async () => {
      try {
        const result = await requestCameraPermission();
        setCameraBlocked(!!result.blocked);
        if (result.granted) {
          setCameraPermissionGranted(true);
          setShowCameraPopup(false);
          navigateToCamera();
        }
      } finally {
        setCameraLoading(false);
      }
    })();
  }, [cameraBlocked, navigateToCamera, setCameraPermissionGranted]);

  const handleCameraPopupClose = useCallback(() => {
    setShowCameraPopup(false);
    flowActiveRef.current = false;
  }, []);

  const value = useMemo(
    () => ({ startIdentificationEntry }),
    [startIdentificationEntry]
  );

  return (
    <IdentificationEntryContext.Provider value={value}>
      {children}

      <LocationPermissionPopup
        visible={showEnableLocationPopup && !awaitingNative}
        onClose={handleLocationPopupClose}
        onAllowLocation={handleAllowLocation}
        onCustomLocation={handleCustomLocation}
        loading={locationRequestLoading}
      />

      <LocationManageAccessPopup
        visible={showManagePopup}
        onClose={() => {
          setShowManagePopup(false);
          if (flowActiveRef.current) {
            void proceedAfterLocationResolved();
          }
        }}
        onCustomLocation={handleManagePopupCustomLocation}
      />

      <ChangeLocationBottomSheet
        visible={showChangeLocationSheet}
        onClose={() => {
          setShowChangeLocationSheet(false);
          if (flowActiveRef.current) {
            void proceedAfterLocationResolved();
          }
        }}
        initialQuery={locationLabel}
        variant={changeLocationVariant}
        onConfirm={(location) => {
          applyManualLocation(location);
          if (flowActiveRef.current) {
            void proceedAfterLocationResolved();
          }
        }}
      />

      <CameraPermissionPopup
        visible={showCameraPopup}
        onClose={handleCameraPopupClose}
        onAllowCamera={handleAllowCamera}
        loading={cameraLoading}
        openSettings={cameraBlocked}
      />
    </IdentificationEntryContext.Provider>
  );
};
