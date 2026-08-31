/**
 * Identification permission flow (location + camera/microphone popups).
 * Identify tab opens Choose a Method. Photo: location → camera popup → Camera.
 * Sound: location → microphone popup → SoundIdentify.
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
  ChooseMethodPopup,
  LocationManageAccessPopup,
  LocationPermissionPopup,
  MicrophonePermissionPopup,
} from "../../molecules/Modal";
import { RootStackParamList } from "../../navigation/types";
import {
  checkCameraPermission,
  openDeviceSettings,
  requestCameraPermission,
  requestMicrophonePermission,
} from "../../services/permissions";
import { shouldSkipLocationPermissionPrompt } from "../../services/permissions/permissionPromptSkip";
import { shouldShowIdentificationLocationGate } from "./locationToggle.helpers";
import { useIdentificationLocationStore } from "./identificationLocation.store";
import { useLocationPermissionUiStore } from "./locationPermissionUi.store";
import { useLocationToggleFlow } from "./useLocationToggleFlow";
import { useIdentificationEntryStore } from "./identificationEntry.store";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type IdentificationEntryContextValue = {
  startIdentificationEntry: () => void;
  startSoundIdentificationEntry: () => void;
  openIdentifyMethodChooser: () => void;
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
    syncPermission,
  } = useLocationToggleFlow();

  const awaitingNative = useLocationPermissionUiStore((s) => s.awaitingNative);

  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [showMicrophonePopup, setShowMicrophonePopup] = useState(false);
  const [microphoneLoading, setMicrophoneLoading] = useState(false);
  const [microphoneBlocked, setMicrophoneBlocked] = useState(false);
  const [showChooseMethodPopup, setShowChooseMethodPopup] = useState(false);
  const flowActiveRef = useRef(false);
  const flowKindRef = useRef<"photo" | "sound">("photo");
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

  const navigateToSoundIdentify = useCallback(() => {
    flowActiveRef.current = false;
    navigation.navigate("MainTabs", {
      screen: "Camera",
      params: { screen: "SoundIdentify" },
    });
  }, [navigation]);

  const proceedAfterLocationResolved = useCallback(async () => {
    if (flowKindRef.current === "sound") {
      navigateToSoundIdentify();
      return;
    }

    const camera = await checkCameraPermission();
    setCameraPermissionGranted(camera.granted);
    if (camera.granted) {
      navigateToCamera();
      return;
    }
    setCameraBlocked(!!camera.blocked);
    setShowCameraPopup(true);
  }, [navigateToCamera, navigateToSoundIdentify, setCameraPermissionGranted]);

  const beginIdentificationEntry = useCallback(
    async (kind: "photo" | "sound") => {
      flowActiveRef.current = true;
      flowKindRef.current = kind;
      setShowMicrophonePopup(false);
      setShowCameraPopup(false);

      const skipLocation = await shouldSkipLocationPermissionPrompt();
      if (skipLocation) {
        await syncPermission();
        void proceedAfterLocationResolved();
        return;
      }

      if (shouldShowIdentificationLocationGate()) {
        void promptForLocation();
        return;
      }

      void proceedAfterLocationResolved();
    },
    [proceedAfterLocationResolved, promptForLocation, syncPermission]
  );

  const startIdentificationEntry = useCallback(() => {
    void beginIdentificationEntry("photo");
  }, [beginIdentificationEntry]);

  const startSoundIdentificationEntry = useCallback(() => {
    void beginIdentificationEntry("sound");
  }, [beginIdentificationEntry]);

  useEffect(() => {
    const store = useIdentificationEntryStore.getState();
    store.setStartEntryHandler(startIdentificationEntry);
    store.setStartSoundEntryHandler(startSoundIdentificationEntry);
    return () => {
      const next = useIdentificationEntryStore.getState();
      next.setStartEntryHandler(null);
      next.setStartSoundEntryHandler(null);
    };
  }, [startIdentificationEntry, startSoundIdentificationEntry]);

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

  const handleAllowMicrophone = useCallback(() => {
    if (microphoneBlocked) {
      void openDeviceSettings();
      return;
    }

    setMicrophoneLoading(true);
    void (async () => {
      try {
        const result = await requestMicrophonePermission();
        setMicrophoneBlocked(!!result.blocked);
        if (result.granted) {
          setShowMicrophonePopup(false);
          navigateToSoundIdentify();
        }
      } finally {
        setMicrophoneLoading(false);
      }
    })();
  }, [microphoneBlocked, navigateToSoundIdentify]);

  const handleMicrophonePopupClose = useCallback(() => {
    setShowMicrophonePopup(false);
    flowActiveRef.current = false;
  }, []);

  const openIdentifyMethodChooser = useCallback(() => {
    setShowChooseMethodPopup(true);
  }, []);

  const handleChooseSound = useCallback(() => {
    setShowChooseMethodPopup(false);
    startSoundIdentificationEntry();
  }, [startSoundIdentificationEntry]);

  const handleChoosePhoto = useCallback(() => {
    setShowChooseMethodPopup(false);
    startIdentificationEntry();
  }, [startIdentificationEntry]);

  const handleChooseStepByStep = useCallback(() => {
    setShowChooseMethodPopup(false);
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: { screen: "StepByStep", params: { startFresh: true } },
    });
  }, [navigation]);

  const value = useMemo(
    () => ({
      startIdentificationEntry,
      startSoundIdentificationEntry,
      openIdentifyMethodChooser,
    }),
    [
      startIdentificationEntry,
      startSoundIdentificationEntry,
      openIdentifyMethodChooser,
    ]
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

      <MicrophonePermissionPopup
        visible={showMicrophonePopup}
        onClose={handleMicrophonePopupClose}
        onAllowMicrophone={handleAllowMicrophone}
        loading={microphoneLoading}
        openSettings={microphoneBlocked}
      />

      <ChooseMethodPopup
        visible={showChooseMethodPopup}
        onClose={() => setShowChooseMethodPopup(false)}
        onSelectSound={handleChooseSound}
        onSelectPhoto={handleChoosePhoto}
        onSelectStepByStep={handleChooseStepByStep}
      />
    </IdentificationEntryContext.Provider>
  );
};
