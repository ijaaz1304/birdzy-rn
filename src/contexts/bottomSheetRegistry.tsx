/**
 * Bottom Sheet Registry – single place to track all bottom sheet types.
 * Add new sheets here and use getDefaultSheetRegistry() with BottomSheetProvider.
 */

import React, { ComponentType } from "react";
import { CommunityRulesModal } from "../features/feed/components/CommunityRulesModal";
import { ReportBottomSheet } from "../features/feed/components/ReportBottomSheet";
import { AddToCollectionBottomSheet } from "../features/camera/components/AddToCollectionBottomSheet";
import { CreateCollectionBottomSheet } from "../features/camera/components/CreateCollectionBottomSheet";
import { LimitReachedBottomSheet } from "../molecules/Modal/LimitReachedBottomSheet";
import { RateUsModal } from "../molecules/Modal/RateUsModal";
import { FeedbackModal } from "../molecules/Modal/FeedbackModal";
import type { FeedConfig } from "../features/feed/config/feedConfig.types";
import type { Collection } from "../services/api/features/core.api.types";
import type { LimitType } from "../config/subscription.config";

export type SheetComponentProps = {
  visible: boolean;
  onClose: () => void;
  [key: string]: unknown;
};

const noop = () => {};

/**
 * Default registry: all sheet ids and their components.
 * Add new entries here so every sheet is tracked in one file.
 */
export function getDefaultSheetRegistry(): Record<
  string,
  ComponentType<SheetComponentProps>
> {
  return {
    communityRules: (props: SheetComponentProps) => (
      <CommunityRulesModal
        visible={props.visible}
        onClose={props.onClose}
        onAgree={(props.onAgree as (() => void) | undefined) ?? noop}
        config={props.config as FeedConfig}
      />
    ),
    report: (props: SheetComponentProps) => (
      <ReportBottomSheet
        visible={props.visible}
        onClose={props.onClose}
        onSubmit={
          (props.onSubmit as (message: string) => void | undefined) ?? noop
        }
        title={props.title as string | undefined}
        description={props.description as string | undefined}
      />
    ),
    addToCollection: (props: SheetComponentProps) => (
      <AddToCollectionBottomSheet
        visible={props.visible}
        onClose={props.onClose}
        mushroomId={props.mushroomId as string}
        refreshTrigger={props.refreshTrigger}
        onConfirm={
          (props.onConfirm as (collectionId: string) => void | undefined) ??
          noop
        }
        onRequestCreateNew={
          props.onRequestCreateNew as (() => void) | undefined
        }
        initialSelectedCollectionId={
          props.initialSelectedCollectionId as string | undefined
        }
      />
    ),
    createCollection: (props: SheetComponentProps) => (
      <CreateCollectionBottomSheet
        visible={props.visible}
        onClose={props.onClose}
        onCreated={
          (props.onCreated as
            | ((collection: Collection) => void)
            | undefined) ?? noop
        }
        onLimitReached={props.onLimitReached as (() => void) | undefined}
      />
    ),
    limitReached: (props: SheetComponentProps) => (
      <LimitReachedBottomSheet
        visible={props.visible}
        onClose={props.onClose}
        onUpgrade={(props.onUpgrade as (() => void) | undefined) ?? noop}
        limitType={(props.limitType as LimitType | undefined) ?? "collection"}
        use70Discount={props.use70Discount as boolean | undefined}
      />
    ),
    rateUs: (props: SheetComponentProps) => (
      <RateUsModal
        visible={props.visible}
        onClose={props.onClose}
        onLowRating={
          (props.onLowRating as ((rating: number) => void) | undefined) ??
          noop
        }
        onHighRating={
          (props.onHighRating as ((rating: number) => void) | undefined) ??
          noop
        }
      />
    ),
    feedback: (props: SheetComponentProps) => (
      <FeedbackModal
        visible={props.visible}
        onClose={props.onClose}
        onSubmit={
          ((props.onSubmit as
            | ((data: {
                name: string;
                email: string;
                feedback: string;
                rating?: number;
              }) => void)
            | undefined) ?? noop)
        }
        rating={props.rating as number | undefined}
      />
    ),
  };
}
