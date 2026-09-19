/** Design-system barrel. Feature verticals import from '../../ds'. */

export { Badge, TagChip, type BadgeProps, type BadgeVariant, type TagChipProps } from './components/Badge';
export { Button, type ButtonProps } from './components/Button';
export { CalendarGrid, type CalendarEntry, type CalendarGridProps } from './components/CalendarGrid';
export { Card, type CardProps } from './components/Card';
export { Checkbox, type CheckboxProps } from './components/Checkbox';
export {
  ConflictField,
  DiffFieldRow,
  DiffFooter,
  DiffRecord,
  DiffSummaryChips,
  type ConflictFieldProps,
  type DiffCounts,
  type DiffFieldRowProps,
  type DiffFooterProps,
  type DiffGroup,
  type DiffSummaryChipsProps,
} from './components/Diff';
export { DateField, DatePicker, buildMonthGrid, type DateFieldProps, type DatePickerProps, type DatePreset } from './components/DatePicker';
export { Drawer, requestDrawerClose, type DrawerProps } from './components/Drawer';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export {
  FilterBar,
  FilterButton,
  FilterMenu,
  FilterPanel,
  type FilterBarProps,
  type FilterButtonProps,
  type FilterChipData,
  type FilterMenuProps,
  type FilterOption,
  type FilterPanelProps,
} from './components/FilterBar';
export { Icon, ICON_NAMES, type IconName, type IconProps } from './components/Icon';
export {
  KanbanBoard,
  type KanbanBoardProps,
  type KanbanCardData,
  type KanbanColumnData,
  type KanbanMove,
} from './components/Kanban';
export { Modal, type ModalProps } from './components/Modal';
export { PageHeader, type PageHeaderProps } from './components/PageHeader';
export { Popover, type PopoverProps } from './components/Popover';
export {
  SectionNav,
  activeSectionIndex,
  sectionPathOf,
  type SectionNavItem,
  type SectionNavProps,
} from './components/SectionNav';
export { SelectField, type SelectFieldProps, type SelectOption } from './components/Select';
export { StatCard, StatCardRow, type StatCardProps, type StatDelta } from './components/StatCard';
export { DataTable, shouldOpenFromClick, type ColumnDef, type DataTableProps, type OpenClickEvent, type SortDir } from './components/Table';
export { Tabs, type TabDef, type TabsProps } from './components/Tabs';
export { TextAreaField, TextField, type TextAreaFieldProps, type TextFieldProps } from './components/Input';
export { ToastRegion } from './components/Toast';
export { toast, subscribeToasts, type ToastAction, type ToastInput, type ToastItem } from './toast-bus';
export {
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  defaultTheme,
  getActiveTheme,
  initTheme,
  isThemeKey,
  type ThemeKey,
  type ThemeMeta,
  type ThemeSwatch,
} from './themes';
export { ENTER_STAGGER_CAP, ENTER_TOTAL_MS, enterStyle, useEntrance } from './motion';
