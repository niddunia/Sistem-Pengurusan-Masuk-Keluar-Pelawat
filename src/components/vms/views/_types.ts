// Shared VMS view types (used by security/staff/admin views)

export interface VisitorLite {
  id?: string;
  fullName: string;
  icPassportNo?: string;
  phone?: string;
  email?: string | null;
  company?: string | null;
}

export interface HostStaffLite {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  department?: { id?: string; name: string } | null;
}

export interface DocLite {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  docType?: string;
}

export interface FeedbackLite {
  rating: number;
  comments?: string | null;
}

export interface VisitList {
  id: string;
  referenceCode: string;
  purpose: string;
  status: string;
  createdAt: string;
  expectedVisitDate?: string;
  checkedInAt?: string | null;
  staffVerifiedAt?: string | null;
  feedbackSubmittedAt?: string | null;
  checkedOutAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  exitNotes?: string | null;
  pdpaConsent?: boolean;
  visitor: VisitorLite;
  hostStaff: HostStaffLite;
  approvedBy?: { fullName: string } | null;
  exitConfirmedBy?: { fullName: string } | null;
  feedback?: FeedbackLite | null;
  documents?: DocLite[];
}

export interface SecurityCounts {
  pendingApproval: number;
  activeVisitors: number;
  readyForExit: number;
  checkedOutToday: number;
  totalToday: number;
  overstay: number;
}

export interface SecurityDashboardData {
  counts: SecurityCounts;
  pendingApproval: VisitList[];
  activeVisitors: VisitList[];
  readyForExit: VisitList[];
  overstayVisits: VisitList[];
}

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  department: { id: string; name: string };
}

// ===== Staff Dashboard types =====
export interface StaffWaitingVisit {
  id: string;
  referenceCode: string;
  purpose: string;
  status: string;
  checkedInAt?: string | null;
  expectedVisitDate?: string;
  createdAt?: string;
  visitor: {
    fullName: string;
    icPassportNo?: string;
    phone?: string;
    email?: string | null;
    company?: string | null;
  };
  documents?: DocLite[];
}

export interface StaffInProgressVisit {
  id: string;
  referenceCode: string;
  purpose: string;
  status: string;
  staffVerifiedAt?: string | null;
  staffRemarks?: string | null;
  visitor: { fullName: string; company?: string | null };
  feedback?: { rating: number; comments?: string | null } | null;
}

export interface StaffHistoryVisit {
  id: string;
  referenceCode: string;
  purpose: string;
  status: string;
  createdAt: string;
  checkedOutAt?: string | null;
  visitor: { fullName: string; company?: string | null };
  feedback?: { rating: number } | null;
}

export interface StaffCounts {
  waiting: number;
  inProgress: number;
  history: number;
  unreadNotifications: number;
}

export interface StaffDashboardData {
  counts: StaffCounts;
  waiting: StaffWaitingVisit[];
  inProgress: StaffInProgressVisit[];
  history: StaffHistoryVisit[];
}
