import { Vessel, RankPosition, CrewMember, Document, Contract } from './types';

export const VESSELS: Vessel[] = [
  { id: 'v-ocean-star', name: 'Ocean Star II', flag: 'US', type: 'Tanker', riskAllowance: 800 },
  { id: 'v-north-horizon', name: 'North Horizon', flag: 'Panama', type: 'Cargo', riskAllowance: 400 },
  { id: 'v-sea-explorer', name: 'Sea Explorer', flag: 'Liberia', type: 'Research', riskAllowance: 200 }
];

export const RANKS: RankPosition[] = [
  { id: 'r-captain', name: 'Captain', baseWage: 8500, loyaltyAllowance: 400 },
  { id: 'r-chief-eng', name: 'Chief Engineer', baseWage: 7800, loyaltyAllowance: 350 },
  { id: 'r-chief-off', name: 'Chief Officer', baseWage: 6500, loyaltyAllowance: 300 },
  { id: 'r-able-seaman', name: 'Able Seaman', baseWage: 3500, loyaltyAllowance: 150 }
];

export const INITIAL_CREW: CrewMember[] = [
  {
    id: 'CR-09822',
    name: 'John Doe',
    email: 'j.doe@maritime.com',
    bankAccount: '****5678 (USD Main Bank)',
    nextOfKin: 'Mary Doe (Spouse)',
    seaServiceHistory: '12 Years',
    medicalClearanceStatus: 'Valid',
    status: 'Active',
    vesselId: 'v-ocean-star',
    rankId: 'r-captain',
    activeContractId: 'con-john-doe-initial'
  },
  {
    id: 'CR-09823',
    name: 'Jane Smith',
    email: 'jane.s@maritime.com',
    bankAccount: '****1234 (Global Marine Bank)',
    nextOfKin: 'John Smith (Brother)',
    seaServiceHistory: '8 Years',
    medicalClearanceStatus: 'Valid',
    status: 'Active',
    vesselId: 'v-north-horizon',
    rankId: 'r-chief-eng',
    activeContractId: 'con-jane-smith-initial'
  },
  {
    id: 'CR-09824',
    name: 'Robert Chen',
    email: 'r.chen@maritime.com',
    bankAccount: '****4321 (Asia Safe Bank)',
    nextOfKin: 'Li Chen (Mother)',
    seaServiceHistory: '4 Years',
    medicalClearanceStatus: 'Expired',
    status: 'Active',
    vesselId: 'v-sea-explorer',
    rankId: 'r-able-seaman',
    activeContractId: null
  },
  {
    id: 'CR-09825',
    name: 'Sarah Jenkins',
    email: 's.jenkins@maritime.com',
    bankAccount: '****8765 (US Navy Credit)',
    nextOfKin: 'David Jenkins (Spouse)',
    seaServiceHistory: '10 Years',
    medicalClearanceStatus: 'Valid',
    status: 'Active',
    vesselId: 'v-ocean-star',
    rankId: 'r-chief-off',
    activeContractId: 'con-sarah-jenkins-initial'
  }
];

export const INITIAL_DOCUMENTS: Document[] = [
  // John Doe documents
  {
    id: 'doc-john-1',
    crewId: 'CR-09822',
    name: 'Passport',
    number: 'PP-984411A',
    issueDate: '2021-01-10',
    expiryDate: '2026-01-09', // Expired
    issuingAuthority: 'US Department of State',
  },
  {
    id: 'doc-john-2',
    crewId: 'CR-09822',
    name: 'Master License',
    number: 'LIC-4402A',
    issueDate: '2023-05-15',
    expiryDate: '2028-05-14', // Valid
    issuingAuthority: 'US Merchant Marine',
  },
  {
    id: 'doc-john-3',
    crewId: 'CR-09822',
    name: 'Medical Fitness Certificate',
    number: 'MED-8812',
    issueDate: '2025-06-12',
    expiryDate: '2026-07-10', // under 30 days (as of June 17, 2026)
    issuingAuthority: 'Seafarers Hospital',
  },
  {
    id: 'doc-john-4',
    crewId: 'CR-09822',
    name: 'US C1/D Visa',
    number: 'VIS-3301',
    issueDate: '2024-02-20',
    expiryDate: '2029-02-19', // Valid
    issuingAuthority: 'US Embassy',
  },
  {
    id: 'doc-john-5',
    crewId: 'CR-09822',
    name: 'Signed Wet-Ink Contract',
    number: 'CON-7711-S',
    issueDate: '2025-12-01',
    expiryDate: '2026-11-30', // Valid (or archived)
    issuingAuthority: 'Crewing Office PA',
  },

  // Jane Smith documents
  {
    id: 'doc-jane-1',
    crewId: 'CR-09823',
    name: 'Passport',
    number: 'PP-776412B',
    issueDate: '2020-03-15',
    expiryDate: '2025-03-14', // Expired
    issuingAuthority: 'UK Passport Office',
  },
  {
    id: 'doc-jane-2',
    crewId: 'CR-09823',
    name: 'Chief Engineer License',
    number: 'ENG-9011X',
    issueDate: '2024-04-18',
    expiryDate: '2029-04-17', // Valid
    issuingAuthority: 'UK Maritime Agency',
  },
  {
    id: 'doc-jane-3',
    crewId: 'CR-09823',
    name: 'Medical Fitness Certificate',
    number: 'MED-5501',
    issueDate: '2025-08-10',
    expiryDate: '2026-08-09', // Under 60 days
    issuingAuthority: 'St. Mary Maritime Medics',
  },

  // Robert Chen documents
  {
    id: 'doc-robert-1',
    crewId: 'CR-09824',
    name: 'Passport',
    number: 'PP-332115C',
    issueDate: '2025-11-01',
    expiryDate: '2026-06-30', // Under 30 days
    issuingAuthority: 'China Passport Services',
  },
  {
    id: 'doc-robert-2',
    crewId: 'CR-09824',
    name: 'Basic Safety Training Certificate',
    number: 'BST-5011Z',
    issueDate: '2021-02-12',
    expiryDate: '2026-02-11', // Expired
    issuingAuthority: 'Shanghai Maritime School',
  },

  // Sarah Jenkins documents
  {
    id: 'doc-sarah-1',
    crewId: 'CR-09825',
    name: 'Passport',
    number: 'PP-112233D',
    issueDate: '2019-09-10',
    expiryDate: '2024-09-09', // Expired
    issuingAuthority: 'US Department of State',
  },
  {
    id: 'doc-sarah-2',
    crewId: 'CR-09825',
    name: 'Chief Officer License',
    number: 'LIC-7721Y',
    issueDate: '2024-11-15',
    expiryDate: '2029-11-14', // Valid
    issuingAuthority: 'US Coast Guard',
  },
  {
    id: 'doc-sarah-3',
    crewId: 'CR-09825',
    name: 'US C1/D Visa',
    number: 'VIS-9912Z',
    issueDate: '2017-08-10',
    expiryDate: '2027-08-09', // Valid (> 90 days)
    issuingAuthority: 'US Embassy London',
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'con-john-doe-initial',
    crewId: 'CR-09822',
    vesselId: 'v-ocean-star',
    rankId: 'r-captain',
    startDate: '2025-12-01',
    endDate: '2026-11-30',
    baseWage: 8500,
    riskAllowance: 800,
    loyaltyAllowance: 400,
    totalMonthly: 9700,
    generatedAt: '2025-12-01T08:00:00Z'
  },
  {
    id: 'con-jane-smith-initial',
    crewId: 'CR-09823',
    vesselId: 'v-north-horizon',
    rankId: 'r-chief-eng',
    startDate: '2025-10-15',
    endDate: '2026-10-14',
    baseWage: 7800,
    riskAllowance: 400,
    loyaltyAllowance: 350,
    totalMonthly: 8550,
    generatedAt: '2025-10-15T09:00:00Z'
  },
  {
    id: 'con-sarah-jenkins-initial',
    crewId: 'CR-09825',
    vesselId: 'v-ocean-star',
    rankId: 'r-chief-off',
    startDate: '2026-01-10',
    endDate: '2027-01-09',
    baseWage: 6500,
    riskAllowance: 800,
    loyaltyAllowance: 300,
    totalMonthly: 7600,
    generatedAt: '2026-01-10T10:30:00Z'
  }
];

// Helper to calculate document expiry status dynamically relative to current date (or a fixed baseline for absolute sanity)
// The user's system date is set to 2026-06-17.
export function getDocumentStatus(expiryDateStr: string, currentDateStr: string = '2026-06-17'): {
  label: 'EXPIRED' | 'CRITICAL (<30 days)' | 'WARNING (<90 days)' | 'VALID';
  daysLeft: number;
} {
  const expiry = new Date(expiryDateStr);
  const current = new Date(currentDateStr);
  
  // Calculate difference in days
  const diffTime = expiry.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { label: 'EXPIRED', daysLeft: diffDays };
  } else if (diffDays <= 30) {
    return { label: 'CRITICAL (<30 days)', daysLeft: diffDays };
  } else if (diffDays <= 90) {
    return { label: 'WARNING (<90 days)', daysLeft: diffDays };
  } else {
    return { label: 'VALID', daysLeft: diffDays };
  }
}
