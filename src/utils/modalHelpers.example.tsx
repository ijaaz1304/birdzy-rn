/**
 * Example Usage of Individual Modals with Helper Functions
 *
 * Use individual modal components (CongratulationsModal, LocationPermissionPopup, etc.)
 * with configs from modalHelpers. Do not use DynamicModal/DynamicBottomSheet in new code.
 */

import React, { useState } from "react";
import { Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CongratulationsModal } from "../molecules/Modal/CongratulationsModal";
import { UpgradeModal } from "../molecules/Modal/UpgradeModal";
import {
  getCongratulationsModalConfig,
  getUnlimitedChatsModalConfig,
} from "./modalHelpers";

/**
 * Example: Using CongratulationsModal with helper config
 */
export const ExampleCongratulationsModalUsage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const config = getCongratulationsModalConfig(
    5,
    () => setShowModal(false),
    () => {
      setShowModal(false);
      navigation.navigate("Home" as never);
    }
  );

  return (
    <>
      <Button title="Show Congratulations" onPress={() => setShowModal(true)} />
      <CongratulationsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        {...config}
      />
    </>
  );
};

/**
 * Example: Using UpgradeModal with getUnlimitedChatsModalConfig
 */
export const ExampleUnlimitedChatsModalUsage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const config = getUnlimitedChatsModalConfig(
    () => setShowModal(false),
    navigation as any
  );

  return (
    <>
      <Button title="Show Unlimited Chats" onPress={() => setShowModal(true)} />
      <UpgradeModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        {...config}
      />
    </>
  );
};
