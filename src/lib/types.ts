export type UserRole = 'technician' | 'operator' | 'admin' | 'regulator' | 'funder';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hash: string;
  bank?: {
    bankName: string;
    accountNumber: string; // 10 digits
    accountName?: string;
  };
  location?: string;
  active: boolean;
  eligible: boolean; // Must be eligible to log recoveries
  consentAt: string; // ISO UTC
  createdAt: string; // ISO UTC
}

export interface Training {
  _id: string;
  userId: string;
  techName: string;
  date: string;
  trainer: string;
  chapter: string; // NARAP chapter e.g., 'Kogi State Chapter'
  certificateRef: string;
  status: 'pending' | 'certified' | 'revoked';
  updatedAt: string;
}

export type CylinderStatus = 'recovered' | 'verified' | 'rejected' | 'reclaimed' | 'destroyed';

export interface CylinderEvent {
  at: string; // ISO UTC
  by: string; // userId or name
  role: UserRole;
  type: string; // 'RECOVERED' | 'VERIFIED' | 'REJECTED' | 'RECLAIMED' | 'DESTROYED' | 'FLAGGED'
  note?: string;
}

export interface FraudFlag {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: string;
}

export interface RecoveryCylinder {
  _id: string;
  code: string; // Unique cylinder code e.g. CCL-LKJ-0012
  techId: string;
  techName: string;
  equipment: 'Split AC' | 'Refrigerator' | 'Freezer' | 'Cold room' | 'Vehicle AC' | 'Other';
  gasLogged: string; // e.g. 'R-22', 'R-410A', 'R-134a'
  gas?: string; // Confirmed by operator using refrigerant identifier
  estGrams: number; // Integer grams
  weightGrams?: number; // Integer grams after calibrated weighing
  location: {
    text: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
  };
  photos: {
    url: string;
    type: 'cylinder' | 'equipment' | 'identifier';
    caption?: string;
  }[];
  collectionPointId?: string;
  status: CylinderStatus;
  rejectionReason?: string;
  flags: FraudFlag[];
  events: CylinderEvent[]; // Append-only
  idempotencyKey?: string;
  createdAt: string; // ISO UTC
  updatedAt: string;
}

export type PayoutStatus = 'pending' | 'paid';

export interface Payout {
  _id: string;
  recId: string; // Unique recovery cylinder _id
  code: string; // Cylinder code
  techId: string;
  techName: string;
  grams: number; // Integer grams
  rateKobo: number; // Integer kobo per kg
  amountKobo: number; // Integer kobo: Math.round((grams * rateKobo) / 1000)
  status: PayoutStatus;
  bank: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
  };
  reference?: string; // Real bank transfer reference
  paidAt?: string; // ISO UTC
  paidBy?: string; // Admin userId who verified payment
  createdAt: string; // ISO UTC
}

export interface CollectionPoint {
  _id: string;
  name: string;
  address: string;
  capacity: number; // Max cylinders in storage
  currentCount?: number;
  operatorIds: string[];
  active: boolean;
}

export interface EquipmentItem {
  _id: string;
  type: 'Scale' | 'Refrigerant Identifier' | 'Recovery Machine' | 'Certified Cylinder';
  serial: string;
  owner: string;
  holder: string;
  calibrationDue: string; // ISO Date string
  status: 'calibrated' | 'calibration_due' | 'out_of_service';
}

export interface Shipment {
  _id: string;
  cylinderIds: string[];
  destination: string;
  type: 'reclamation' | 'destruction';
  certificateNo?: string; // Mandatory for destruction
  shippedDate: string;
  receivedDate?: string;
  status: 'in_transit' | 'completed';
  notes?: string;
}

export interface AppConfig {
  payoutRateKobo: number; // e.g. 450000 kobo (₦4,500)
  varianceThresholdPct: number; // e.g. 20
  gasList: {
    name: string;
    gwp: number; // Global Warming Potential
    active: boolean;
  }[];
  pilotArea: {
    name: string;
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface HardStop {
  id: number;
  title: string;
  description: string;
  isSatisfied: boolean;
  notes?: string;
}

export interface ScoreCriterion {
  id: string;
  title: string;
  maxWeight: number; // 20, 20, 20, 15, 10, 10, 5 = 100
  rating: number; // 0 to 4
  evidenceLink?: string;
  notes?: string;
}

export interface ReadinessAssessment {
  _id: string;
  evaluatedAt: string;
  evaluatedBy: string;
  hardStops: HardStop[];
  scores: ScoreCriterion[];
  overallStatus: 'Go' | 'Adjust' | 'Hold';
  totalScore: number;
}

export interface AuditLogEntry {
  _id: string;
  at: string;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  action: string;
  target: {
    type: string;
    id: string;
  };
  beforeAfterSummary?: string;
}
