export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  themePreference: 'dark' | 'light';
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserProfile;
}

export interface AreaItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  isDefault: boolean;
  pendingTasksCount: number;
  completedTasksCount?: number;
  upcomingEventsCount?: number;
}

export interface SaveAreaPayload {
  name: string;
  description?: string | null;
  color: string;
  icon: string;
}

export interface LabelItem {
  id: string;
  name: string;
  color: string;
}

export interface TaskDetailItem {
  id: string;
  title: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  projectId?: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'Todo' | 'InProgress' | 'OnHold' | 'Done' | 'Cancelled' | string;
  isCompleted: boolean;
  startDate?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  completedAt?: string | null;
  labels: LabelItem[];
  recurrenceFrequency?: string;
}

export interface SaveTaskPayload {
  title: string;
  description?: string | null;
  areaId: string;
  projectId?: string | null;
  priority: string;
  status: string;
  startDate?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  labelIds?: string[];
  recurrenceFrequency?: string | null;
}

export interface EventDetailItem {
  id: string;
  title: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  location?: string | null;
  startAt: string;
  endAt: string;
  timeLabel: string;
  period: string;
  isAllDay: boolean;
  isHighlighted: boolean;
  subItems: string[];
  recurrenceFrequency?: string;
}

export interface SaveEventPayload {
  title: string;
  description?: string | null;
  areaId: string;
  location?: string | null;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  isHighlighted: boolean;
  subItems?: string[];
  recurrenceFrequency?: string | null;
}

export interface CalendarEntryItem {
  compositeId: string;
  sourceId: string;
  entryType: 'event' | 'task';
  title: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceFrequency: string;
  priority?: string | null;
  status?: string | null;
  location?: string | null;
}

export interface RescheduleCalendarEntryPayload {
  sourceId: string;
  entryType: 'event' | 'task';
  startAt: string;
  endAt?: string | null;
  isAllDay: boolean;
}

export interface KanbanProjectSummaryItem {
  id: string;
  name: string;
  areaId: string;
  areaName: string;
  areaColor: string;
}

export interface KanbanCardItem {
  id: string;
  title: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  projectId?: string | null;
  projectName?: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'Todo' | 'InProgress' | 'OnHold' | 'Done' | string;
  boardPosition: number;
  isCompleted: boolean;
  isOverdue: boolean;
  startDate?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  labels: LabelItem[];
  recurrenceFrequency: string;
}

export interface KanbanColumnItem {
  status: 'Todo' | 'InProgress' | 'OnHold' | 'Done' | string;
  title: string;
  position: number;
  cards: KanbanCardItem[];
}

export interface KanbanBoardData {
  boardId: string;
  boardName: string;
  totalCardsCount: number;
  overdueCount: number;
  columns: KanbanColumnItem[];
  projects: KanbanProjectSummaryItem[];
}

export interface QuickNoteItem {
  id: string;
  content: string;
  areaId?: string | null;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  noteType: 'Task' | 'Event' | 'Reminder' | 'Note' | string;
  priority?: string | null;
  targetDate?: string | null;
  isProcessed: boolean;
  processedEntityId?: string | null;
  createdAt: string;
}

export interface SaveQuickNotePayload {
  content: string;
  areaId?: string | null;
  noteType?: string;
  priority?: string | null;
  targetDate?: string | null;
}

export interface ConvertQuickNotePayload {
  targetType: 'Task' | 'Event';
  areaId?: string | null;
  priority?: string | null;
  targetDate?: string | null;
  targetTime?: string | null;
}

export interface ProjectDetailItem {
  id: string;
  name: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Archived' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  totalTasksCount: number;
  completedTasksCount: number;
  progressPercent: number;
  tasks: TaskDetailItem[];
}

export interface SaveProjectPayload {
  name: string;
  description?: string | null;
  areaId: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: string;
  priority: string;
}

export interface HabitDayCheckItem {
  date: string;
  dayLabel: string;
  isCompleted: boolean;
  isToday: boolean;
}

export interface HabitDetailItem {
  id: string;
  name: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  frequency: string;
  targetPerWeek: number;
  currentStreak: number;
  bestStreak: number;
  weeklyCompletionsCount: number;
  consistencyRatePercent: number;
  completedToday: boolean;
  isActive: boolean;
  lastSevenDays: HabitDayCheckItem[];
}

export interface SaveHabitPayload {
  name: string;
  description?: string | null;
  areaId: string;
  frequency: string;
  targetPerWeek: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  taskId?: string | null;
  eventId?: string | null;
  targetTitle: string;
  remindAt: string;
  isSent: boolean;
}

export interface NotificationCenterData {
  unreadCount: number;
  notifications: NotificationItem[];
  upcomingReminders: ReminderItem[];
}

export interface AreaProductivityItem {
  areaId: string;
  areaName: string;
  areaColor: string;
  pendingTasksCount: number;
  completedTasksCount: number;
  upcomingEventsCount: number;
  completionRatePercent: number;
}

export interface ProductivityReportData {
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  overallCompletionRatePercent: number;
  activeProjectsCount: number;
  activeHabitsCount: number;
  bestHabitStreak: number;
  areaBreakdown: AreaProductivityItem[];
}

export interface SettingsOverviewData {
  userId: string;
  fullName: string;
  email: string;
  themePreference: 'dark' | 'light';
  productivity: ProductivityReportData;
}

export interface MetricDayHistoryItem {
  date: string;
  dayLabel: string;
  value: number;
  isToday: boolean;
}

export interface LifeMetricDetailItem {
  id: string;
  name: string;
  description?: string | null;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  unit: string;
  dailyTarget: number;
  stepIncrement: number;
  icon?: string | null;
  todayValue: number;
  progressPercent: number;
  sevenDayAverage: number;
  isTargetReached: boolean;
  lastSevenDays: MetricDayHistoryItem[];
}

export interface SaveLifeMetricPayload {
  name: string;
  description?: string | null;
  areaId: string;
  unit: string;
  dailyTarget: number;
  stepIncrement?: number;
  icon?: string | null;
}

export interface DashboardTaskItem {
  id: string;
  title: string;
  areaId: string;
  areaName: string;
  areaSlug: string;
  areaColor: string;
  priority: string;
  status: string;
  isCompleted: boolean;
  dueDate?: string | null;
}

export interface DashboardEventItem {
  id: string;
  title: string;
  timeLabel: string;
  period: string;
  areaName: string;
  areaColor: string;
  isCompleted: boolean;
  isHighlighted: boolean;
  subItems: string[];
  date?: string;
  entryType?: 'event' | 'task';
}

export interface HabitDailyBar {
  dayLabel: string;
  percentage: number;
  isToday: boolean;
}

export interface DashboardSummary {
  totalActiveTasksCount: number;
  pendingTasksCount: number;
  completedTodayCount: number;
  overdueTasksCount: number;
  inProgressCount: number;
  unprocessedNotesCount: number;
  weeklyHabitSuccessRate: number;
  dailyHabitBars: HabitDailyBar[];
  todayTasks: DashboardTaskItem[];
  tomorrowTasks: DashboardTaskItem[];
  todayEvents: DashboardEventItem[];
}
