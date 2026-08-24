/**
 * Feed Stack Navigator
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { FeedStackParamList } from "./types";
import { FeedScreen } from "../features/feed/screens/FeedScreen";
import { CreatePostScreen } from "../features/feed/screens/CreatePostScreen";
import { CropImageScreen } from "../features/feed/screens/CropImageScreen";
import { PostDetailsScreen } from "../features/feed/screens/PostDetailsScreen";
import { NotificationCenterScreen } from "../features/feed/screens/NotificationCenterScreen";
import { useAppConfig } from "../config";
import { birdsFeedConfig } from "../features/feed/config";
const Stack = createNativeStackNavigator<FeedStackParamList>();

export const FeedStack: React.FC = () => {
  const appConfig = useAppConfig();
  // Use feed config from app config, fallback to minerals config
  const feedConfig = appConfig?.feed || birdsFeedConfig;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 180,
      }}
    >
      <Stack.Screen name="FeedMain">
        {(props) => <FeedScreen {...props} config={feedConfig} />}
      </Stack.Screen>
      <Stack.Screen name="CreatePost">
        {(props) => <CreatePostScreen {...props} config={feedConfig} />}
      </Stack.Screen>
      <Stack.Screen name="CropImage" component={CropImageScreen} />
      <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          gestureEnabled: true,
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
};
