/**
 * Backward compatibility exports
 * Re-exports from new atomic design locations
 *
 * @deprecated Use imports from atoms/, molecules/, or organisms/ instead
 */

// Atoms
export { IconButton } from "../../atoms/IconButton";
export type { IconButtonProps } from "../../atoms/IconButton";

export { Checkbox } from "../../atoms/Checkbox";
export type { CheckboxProps } from "../../atoms/Checkbox";

export { RadioButton } from "../../atoms/RadioButton";
export type { RadioButtonProps } from "../../atoms/RadioButton";

export { Toggle } from "../../atoms/Toggle";
export type { ToggleProps } from "../../atoms/Toggle";

// Molecules
export { SearchBar } from "../../molecules/SearchBar";
export type { SearchBarProps, SearchBarState } from "../../molecules/SearchBar";

export { Tab } from "../../molecules/Tab";
export type { TabProps } from "../../molecules/Tab";

export { Accordion } from "../../molecules/Accordion";
export type { AccordionProps, AccordionItem } from "../../molecules/Accordion";

export { ListItem } from "../../molecules/ListItem";
export type { ListItemProps } from "../../molecules/ListItem";

export { PasswordField } from "../../molecules/PasswordField";
export type {
  PasswordFieldProps,
  PasswordFieldState,
} from "../../molecules/PasswordField";

export { TextArea } from "../../molecules/TextArea";
export type { TextAreaProps, TextAreaState } from "../../molecules/TextArea";

export { Pagination } from "../../molecules/Pagination";
export type { PaginationProps } from "../../molecules/Pagination";

// Organisms
export { TopNavBar } from "../../organisms/TopNavBar";
export type { TopNavBarProps } from "../../organisms/TopNavBar";

export { BottomNavBar } from "../../organisms/BottomNavBar";
export type {
  BottomNavBarProps,
  TabItem,
  CenterAction,
} from "../../organisms/BottomNavBar";

// Legacy exports - these will be removed after migration
// For now, keep old component names as aliases
export { IconButton as AppIconButton } from "../../atoms/IconButton";
export { Checkbox as AppCheckbox } from "../../atoms/Checkbox";
export { RadioButton as AppRadioButton } from "../../atoms/RadioButton";
export { Toggle as AppToggle } from "../../atoms/Toggle";
export { SearchBar as AppSearchBar } from "../../molecules/SearchBar";
export { Tab as AppTab } from "../../molecules/Tab";
export { Accordion as AppAccordion } from "../../molecules/Accordion";
export { ListItem as AppListItem } from "../../molecules/ListItem";
export { PasswordField as AppPasswordField } from "../../molecules/PasswordField";
export { TextArea as AppTextArea } from "../../molecules/TextArea";
export { Pagination as AppPagination } from "../../molecules/Pagination";
export { TopNavBar as AppTopNavBar } from "../../organisms/TopNavBar";
export { BottomNavBar as AppBottomNavBar } from "../../organisms/BottomNavBar";

// Shared components exports
export { default as AppText } from "./AppText";
export { default as AppButton } from "./AppButton";
export { default as AppCard } from "./AppCard";
export { default as AppDivider } from "./AppDivider";
export { default as AppDropdown } from "./AppDropdown";
export { default as AppOtherAppCard } from "./AppOtherAppCard";
export { default as AppPaginationAtom } from "./AppPaginationAtom";
export { default as AppPromoCard } from "./AppPromoCard";
export { default as AppPromoCardAskAI } from "./AppPromoCardAskAI";
export { default as AppTextField } from "./AppTextField";
