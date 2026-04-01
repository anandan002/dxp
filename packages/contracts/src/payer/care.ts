import { FhirCoding, FhirContactPoint, FhirPeriod, FhirReference } from './fhir-common';

export type CareEventType = 'admission' | 'discharge' | 'transfer' | 'ed-visit' | 'office-visit' | 'telehealth' | 'lab' | 'imaging' | 'procedure' | 'follow-up';

export interface CareEvent {
  id: string;
  type: CareEventType;
  date: string;
  description: string;
  provider: string;
  facility?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: 'pcp' | 'specialist' | 'care-manager' | 'nurse' | 'pharmacist' | 'social-worker';
  specialty?: string;
  phone?: string;
  email?: string;
  organization?: string;
  isPrimary: boolean;
}

export interface HealthProgram {
  id: string;
  name: string;
  condition: string;
  status: 'enrolled' | 'completed' | 'withdrawn' | 'eligible';
  enrolledDate?: string;
  milestones: ProgramMilestone[];
  nextAction?: string;
  nextActionDate?: string;
  careManager?: string;
}

export interface ProgramMilestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue' | 'skipped';
  dueDate?: string;
  completedDate?: string;
}

export interface DischargePlan {
  encounterId: string;
  dischargeDate: string;
  instructions: string[];
  medications: { name: string; dosage: string; instructions: string }[];
  followUpAppointments: { provider: string; specialty: string; date: string; phone: string }[];
  restrictions?: string[];
}
