/**
 * Projects Page - Clean Exports
 * Export index for all projects page components and utilities
 */

// Main page component
export { Projects } from './Projects';

// Types
export type {
  ProjectsPageProps,
  ProjectFilter,
  ProjectSummaryCard,
  ProjectTableColumn,
  ProjectCardProps,
  ProjectFiltersProps,
  ProjectListProps
} from './types';

export { statusColors, priorityColors } from './types';

// Components
export { ProjectFilters } from './components/ProjectFilters';
export { ProjectTableView } from './components/ProjectTableView';
export { ProjectCardView } from './components/ProjectCardView';

// Hooks
export { useProjectsData } from './hooks/useProjectsData';

// Utils
export {
  formatCurrency,
  formatDate,
  formatProjectStatus,
  formatProjectType,
  formatPriority,
  formatProgressPercentage
} from './utils/formatters';

// Legacy compatibility (existing imports)
export { ProjectsSummaryCards } from './ProjectsSummaryCards';
export { ProjectCard } from './ProjectCard';