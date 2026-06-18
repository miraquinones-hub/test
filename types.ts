export interface Vessel {
  id: string;
  name: string;
  flag: string;
  type: string;
  riskAllowance: number;
}

export interface RankPosition {
  id: string;
  name: string;
  baseWage: number;
  loyaltyAllowance: number;
}

export interface CrewMember {
  id: string; // e.g. CR-09822
  name: string;
  email: string;
  bankAccount: string;
  nextOfKin: string;
  seaServiceHistory: string;
  medicalClearanceStatus: 'Valid' | 'Expired' | 'Pending';
  status: 'Active' | 'Inactive';
  vesselId: string;
  rankId: string;
  activeContractId: string | null;
}

export interface Document {
  id: string;
  crewId: string;
  name: string; // Passport, Master License, Medical Fitness, US C1/D Visa, etc.
  number: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  issuingAuthority: string;
  fileUrl?: string; // base64 or placeholder
  fileName?: string;
  fileType?: 'PDF' | 'PNG' | 'JPG';
  uploadedAt?: string;
}

export interface Contract {
  id: string;
  crewId: string;
  vesselId: string;
  rankId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  baseWage: number;
  riskAllowance: number;
  loyaltyAllowance: number;
  totalMonthly: number;
  generatedAt: string;
  signedDocUrl?: string; // uploaded signed ink scanned contract doc
  signedDocName?: string;
}

export type RoleType = 'Administrator' | 'Manager';
