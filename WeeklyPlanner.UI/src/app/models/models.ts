export interface TeamMember {
  id: number;
  name: string;
  isLead: boolean;
}

export interface BacklogItem {
  id: number;
  title: string;
  category: string;
  estimatedHours: number;
  status: string;
}

export interface WeeklyPlan {
  id: number;
  startDate: string;
  totalPlannedHours: number;
  clientPercentage: number;
  techDebtPercentage: number;
  rnDPercentage: number;
  isFrozen: boolean;
}

export interface TaskAssignment {
  id: number;
  weeklyPlanId: number;
  teamMemberId: number;
  backlogItemId: number;
  plannedHours: number;
  backlogItem?: BacklogItem; // Populated by backend Include()
}

export interface ProgressUpdate {
  id: number;
  taskAssignmentId: number;
  completedHours: number;
  status: string;
  updateDate: string;
}

export interface ProgressUpdateRequest {
  assignmentId: number;
  completedHours: number;
  status: string;
}
