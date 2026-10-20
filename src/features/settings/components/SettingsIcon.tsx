/**
 * Settings icons (Figma Hugeicons exports). Each glyph is placed inside its
 * Figma icon frame at the exported offset so optical alignment matches the design.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import type { SvgProps } from "react-native-svg";
import BackSvg from "../../../assets/icons/settings/back.svg";
import CancelSvg from "../../../assets/icons/settings/cancel.svg";
import ChevronRightSvg from "../../../assets/icons/settings/chevron-right.svg";
import ChevronRightLgSvg from "../../../assets/icons/settings/chevron-right-lg.svg";
import CommentSvg from "../../../assets/icons/settings/comment.svg";
import DeleteSvg from "../../../assets/icons/settings/delete.svg";
import FaqSvg from "../../../assets/icons/settings/faq.svg";
import FileSvg from "../../../assets/icons/settings/file.svg";
import GoogleSvg from "../../../assets/icons/settings/google.svg";
import LogoutSvg from "../../../assets/icons/settings/logout.svg";
import MailSvg from "../../../assets/icons/settings/mail.svg";
import NotificationSvg from "../../../assets/icons/settings/notification.svg";
import ShieldSvg from "../../../assets/icons/settings/shield.svg";
import StarSvg from "../../../assets/icons/settings/star.svg";
import SunSvg from "../../../assets/icons/settings/sun.svg";
import UserSvg from "../../../assets/icons/settings/user.svg";

type IconSpec = {
  Svg: React.FC<SvgProps>;
  frame: number;
  left: number;
  top: number;
};

const ICONS = {
  back: { Svg: BackSvg, frame: 24, left: 8.457, top: 5.25 },
  cancel: { Svg: CancelSvg, frame: 24, left: 0, top: 0 },
  chevronRight: { Svg: ChevronRightSvg, frame: 18, left: 6, top: 3.75 },
  chevronRightLg: { Svg: ChevronRightLgSvg, frame: 20, left: 6.75, top: 4.25 },
  chevronRightList: {
    Svg: ChevronRightLgSvg,
    frame: 24,
    left: 8.85,
    top: 6.25,
  },
  comment: { Svg: CommentSvg, frame: 20, left: 1.042, top: 1.458 },
  delete: { Svg: DeleteSvg, frame: 20, left: 1.876, top: 1.042 },
  faq: { Svg: FaqSvg, frame: 20, left: 1.042, top: 1.042 },
  file: { Svg: FileSvg, frame: 20, left: 2.708, top: 1.042 },
  google: { Svg: GoogleSvg, frame: 24, left: 0, top: 0 },
  logout: { Svg: LogoutSvg, frame: 20, left: 1.874, top: 1.874 },
  mail: { Svg: MailSvg, frame: 20, left: 1.042, top: 2.292 },
  notification: { Svg: NotificationSvg, frame: 20, left: 1.876, top: 1.042 },
  shield: { Svg: ShieldSvg, frame: 20, left: 1.462, top: 1.042 },
  star: { Svg: StarSvg, frame: 20, left: 1.04, top: 1.042 },
  sun: { Svg: SunSvg, frame: 20, left: 1.042, top: 1.042 },
  user: { Svg: UserSvg, frame: 24, left: 2.249, top: 1.25 },
} satisfies Record<string, IconSpec>;

export type SettingsIconName = keyof typeof ICONS;

export interface SettingsIconProps {
  name: SettingsIconName;
  color: string;
}

export const SettingsIcon: React.FC<SettingsIconProps> = ({ name, color }) => {
  const { Svg, frame, left, top } = ICONS[name];
  return (
    <View style={[styles.frame, { width: frame, height: frame }]}>
      <View style={[styles.glyph, { left, top }]}>
        <Svg color={color} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
  },
  glyph: {
    position: "absolute",
  },
});
