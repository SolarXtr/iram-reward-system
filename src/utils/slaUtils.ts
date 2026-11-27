import { ResearchApplication } from '../types';
import { getActionStepFrom19, normalizeWorkflowStep } from '../data/workflow19Steps';

/**
 * Maximum SLA business days for each of the 12 Action Steps
 */
export function getActionStepMaxSlaDays(actionStep: number): number {
  switch (actionStep) {
    case 1: return 1;
    case 2: return 4;
    case 3: return 3;
    case 4: return 2;
    case 5: return 2;
    case 6: return 2;
    case 7: return 3;
    case 8: return 2;
    case 9: return 2;
    case 10: return 3;
    case 11: return 5;
    case 12: return 0; // Completed / Paid
    default: return 3;
  }
}

/**
 * Count Mon–Fri business days elapsed between a YYYY-MM-DD / ISO date string and today.
 */
export function calculateBusinessDaysElapsed(dateStr?: string): number {
  if (!dateStr) return 0;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 0;

  const start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (end <= start) return 0;

  let businessDays = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);

  // Cap loop at 365 days for performance safety
  let guard = 0;
  while (cursor <= end && guard < 365) {
    const dayOfWeek = cursor.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return businessDays;
}

export interface SlaEvaluation {
  isApplicable: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  elapsedDays: number;
  maxDays: number;
  overdueDays: number;
  label: string;
  badgeClass: string;
}

export function evaluateApplicationSla(
  app: Pick<ResearchApplication, 'status' | 'currentStep' | 'paymentStatus' | 'updatedAt' | 'createdAt'>
): SlaEvaluation {
  const inactiveStatuses = ['draft', 'trash', 'paid', 'closed', 'rejected'];
  const ref19 = normalizeWorkflowStep(app.currentStep || 1);
  const actionStep = getActionStepFrom19(ref19);
  const isPaid = app.paymentStatus === 'transferred' || (app.status === 'paid' && ref19 >= 18) || actionStep === 12;

  if (isPaid || inactiveStatuses.includes(app.status)) {
    return {
      isApplicable: false,
      isOverdue: false,
      isDueSoon: false,
      elapsedDays: 0,
      maxDays: 0,
      overdueDays: 0,
      label: '',
      badgeClass: '',
    };
  }

  const maxDays = getActionStepMaxSlaDays(actionStep);
  const elapsedDays = calculateBusinessDaysElapsed(app.updatedAt || app.createdAt);
  const overdueDays = Math.max(0, elapsedDays - maxDays);

  if (overdueDays > 0) {
    return {
      isApplicable: true,
      isOverdue: true,
      isDueSoon: false,
      elapsedDays,
      maxDays,
      overdueDays,
      label: `เกิน SLA +${overdueDays} วัน`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    };
  }

  if (elapsedDays === maxDays && maxDays > 0) {
    return {
      isApplicable: true,
      isOverdue: false,
      isDueSoon: true,
      elapsedDays,
      maxDays,
      overdueDays: 0,
      label: `ครบกำหนด SLA (${maxDays} วัน)`,
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    };
  }

  return {
    isApplicable: true,
    isOverdue: false,
    isDueSoon: false,
    elapsedDays,
    maxDays,
    overdueDays: 0,
    label: `ในเกณฑ์ SLA (${elapsedDays}/${maxDays} วัน)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };
}
