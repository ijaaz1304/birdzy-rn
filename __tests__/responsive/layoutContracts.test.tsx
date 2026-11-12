import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { PostAuthPhoneLayout } from "../../src/features/post-auth-onboarding/components/PostAuthPhoneLayout";
import {
  PostAuthHorizontalPlanCard,
  HORIZONTAL_PLAN_ROW_STYLE,
} from "../../src/features/post-auth-onboarding/components/PostAuthHorizontalPlanCard";
import { PostAuthLegalFooter } from "../../src/features/post-auth-onboarding/components/PostAuthLegalFooter";
import {
  getResponsiveGridColumns,
  getAvailableOverlayHeight,
} from "../../src/utils/responsiveLayout";

jest.mock(
  "../../src/features/post-auth-onboarding/utils/postAuthContentLayout",
  () => ({
    usePostAuthContentLayout: () => ({
      isWideScreen: false,
      contentWidth: 353,
    }),
  })
);
jest.mock("react-native-linear-gradient", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    require("react").createElement(
      require("react-native").View,
      props,
      children
    ),
}));
jest.mock("@react-native-community/blur", () => ({ BlurView: () => null }));
let tree: ReactTestRenderer;
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});

test("purchase content has a scrolling path independently of the phone/tablet column width", async () => {
  await act(async () => {
    tree = create(
      <PostAuthPhoneLayout>
        <Text>Terms that can grow beyond a short window</Text>
      </PostAuthPhoneLayout>
    );
  });
  const viewport = tree.root.findByType(ScrollView);
  expect(viewport.props.contentContainerStyle.flexGrow).toBe(1);
  expect(tree.root.findByType(Text).props.children).toContain("Terms");
});

test("stacked purchase cards retain complete long price, period and trial text and selection", async () => {
  const onPress = jest.fn();
  await act(async () => {
    tree = create(
      <PostAuthHorizontalPlanCard
        title="Yearly Premium"
        priceAmount="₹12,345.67"
        priceSuffix="/year"
        duration="year"
        trialDays={14}
        billingNote="Billed every year after the free trial ends"
        selected
        onPress={onPress}
      />
    );
  });
  expect(HORIZONTAL_PLAN_ROW_STYLE.flexDirection).toBe("column");
  const labels = tree.root.findAllByType(Text);
  const copy = labels.map((node) => String(node.props.children)).join(" ");
  expect(copy).toContain("12,345.67");
  expect(copy).toContain("Billed every year");
  for (const label of labels) {
    expect(label.props.allowFontScaling).not.toBe(false);
    expect(label.props.numberOfLines).toBeUndefined();
    expect(label.props.adjustsFontSizeToFit).not.toBe(true);
  }
  await act(async () =>
    tree.root
      .findAll(
        (node) =>
          node.props.accessibilityRole === "button" &&
          typeof node.props.onPress === "function"
      )[0]
      .props.onPress()
  );
  expect(onPress).toHaveBeenCalledTimes(1);
});

test("wrapping legal links retain terms/privacy/restore handlers and busy state", async () => {
  const onTerms = jest.fn(),
    onPrivacy = jest.fn(),
    onRestore = jest.fn();
  const props = { onTerms, onPrivacy, onRestore };
  await act(async () => {
    tree = create(<PostAuthLegalFooter {...props} />);
  });
  const buttons = tree.root.findAllByType(TouchableOpacity);
  await act(async () => {
    buttons.forEach((button) => button.props.onPress());
  });
  expect(onTerms).toHaveBeenCalledTimes(1);
  expect(onPrivacy).toHaveBeenCalledTimes(1);
  expect(onRestore).toHaveBeenCalledTimes(1);
  await act(async () => {
    tree.update(<PostAuthLegalFooter {...props} isRestoring />);
  });
  expect(tree.root.findAllByType(TouchableOpacity)[2].props.disabled).toBe(
    true
  );
});

test.each([
  [320, 1, 1],
  [360, 1, 2],
  [393, 1, 2],
  [430, 2, 1],
  [768, 3, 1],
])(
  "card grid at width %i and font scale %s uses %i columns",
  (width, scale, expected) => {
    expect(getResponsiveGridColumns(width, scale)).toBe(expected);
  }
);
test("overlay height never forces a phone-sized minimum into a short keyboard window", () => {
  expect(getAvailableOverlayHeight(240, 47, 34)).toBe(159);
  expect(getAvailableOverlayHeight(60, 47, 34)).toBe(1);
});
