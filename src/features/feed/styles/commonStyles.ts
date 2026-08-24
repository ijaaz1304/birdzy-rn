/**
 * Common Styles for Feed Components
 * Shared styles that can be reused across feed screens
 */

import { StyleSheet } from "react-native";
import { OVERLAY_COLORS } from "../../../constants/colorConstants";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

export const commonFeedStyles = StyleSheet.create({
  // Header styles — line below title per design
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexShrink: 1,
    lineHeight: 48,
    paddingVertical: 4,
  },

  // User row styles
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    marginBottom: 16,
    gap: 8,
  },
  userName: {
    marginLeft: 8,
  },

  // Content styles
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: 16,
  },

  // Tabs styles — outer margin 20px
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },

  // List styles
  list: {
    padding: spacing[4],
    gap: spacing[4],
  },

  // Post card styles
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postTitle: {
    marginBottom: 8,
    lineHeight: 32,
    paddingVertical: 2,
  },
  postContent: {
    marginBottom: 8,
    lineHeight: 20,
  },
  itemNameContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    gap: spacing[4],
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Create post styles
  helper: {
    marginTop: 4,
    marginBottom: 12,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  imageContainer: {
    width: "100%",
    minHeight: 200,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: Radius.md,
  },
  postImageContainer: {
    marginBottom: 12,
  },
  postImageCard: {
    overflow: "hidden",
  },
  postImagePlaceholder: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadProgressContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: OVERLAY_COLORS.FEED_OVERLAY,
    padding: 8,
    alignItems: "center",
  },
  uploadProgressBar: {
    height: 4,
    marginBottom: 4,
    borderRadius: 2,
  },
  cropButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  placeholderContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  placeholderText: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },

  // Rules modal styles
  rulesContent: {
    flex: 1,
    width: "100%",
  },
  rulesHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 2,
  },
  rulesHeaderContent: {
    width: "100%",
  },
  rulesTitle: {
    marginBottom: 2,
    textAlign: "center",
  },
  rulesUpdated: {
    textAlign: "center",
    marginTop: 2,
  },
  rulesScrollView: {
    flex: 1,
  },
  rulesScrollContent: {},
  rule: {
    marginBottom: 2,
  },
  ruleTitle: {
    marginBottom: 2,
  },
  ruleText: {
    marginTop: 2,
  },
  rulesFooter: {
    paddingTop: 16,
  },
});
