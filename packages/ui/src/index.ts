// @dxp/ui — Enterprise portal component library
// Portal code imports ONLY from this file. Never from primitives or foundation directly.

// === Theme ===
export { ThemeProvider, useTheme } from './theme/ThemeProvider';
export type { ThemeProviderProps } from './theme/ThemeProvider';
export type { DxpTheme } from './theme/tokens';
export { defaultTheme } from './theme/tokens';

// === Primitives (foundation-abstracted) ===
export { Button } from './primitives/Button';
export type { ButtonProps } from './primitives/Button';

export { Input } from './primitives/Input';
export type { InputProps } from './primitives/Input';

export { Badge } from './primitives/Badge';
export type { BadgeProps } from './primitives/Badge';

export { Card, CardHeader, CardContent, CardFooter } from './primitives/Card';
export type { CardProps } from './primitives/Card';

export { Tabs } from './primitives/Tabs';
export type { TabsProps, Tab } from './primitives/Tabs';

// === Composed (enterprise patterns) ===
export { DataTable } from './composed/DataTable';
export type { DataTableProps, Column } from './composed/DataTable';

export { DashboardCard } from './composed/DashboardCard';
export type { DashboardCardProps } from './composed/DashboardCard';

export { StatusBadge } from './composed/StatusBadge';
export type { StatusBadgeProps } from './composed/StatusBadge';

export { DetailPanel } from './composed/DetailPanel';
export type { DetailPanelProps } from './composed/DetailPanel';

export { MultiStepForm } from './composed/MultiStepForm';
export type { MultiStepFormProps, FormStep } from './composed/MultiStepForm';

export { FilterBar } from './composed/FilterBar';
export type { FilterBarProps, FilterOption } from './composed/FilterBar';

export { NotificationInbox } from './composed/NotificationInbox';
export type { NotificationInboxProps, NotificationItem } from './composed/NotificationInbox';

export { StepIndicator } from './composed/StepIndicator';
export type { StepIndicatorProps, Step } from './composed/StepIndicator';

export { FileUploadZone } from './composed/FileUploadZone';
export type { FileUploadZoneProps, UploadedFile } from './composed/FileUploadZone';

export { DocumentCard } from './composed/DocumentCard';
export type { DocumentCardProps } from './composed/DocumentCard';

// === Layouts ===
export { PageLayout } from './composed/PageLayout';
export type { PageLayoutProps, NavItem } from './composed/PageLayout';
