import { AppConfig, HardStop, ScoreCriterion } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  payoutRateKobo: 450000, // ₦4,500 per verified kg (configurable)
  varianceThresholdPct: 20, // 20% variance flag
  gasList: [
    { name: 'R-22', gwp: 1810, active: true },
    { name: 'R-410A', gwp: 2088, active: true },
    { name: 'R-134a', gwp: 1430, active: true },
    { name: 'R-32', gwp: 675, active: true },
    { name: 'R-404A', gwp: 3922, active: true },
    { name: 'R-407C', gwp: 1774, active: true },
  ],
  pilotArea: {
    name: 'Lokoja, Kogi State, Nigeria',
    minLat: 7.74,
    maxLat: 7.86,
    minLng: 6.68,
    maxLng: 6.80,
  },
};

export const INITIAL_HARD_STOPS: HardStop[] = [
  {
    id: 1,
    title: 'Legal Entity Registration',
    description: 'Quantro Software Labs registered as a legal entity with CAC Nigeria.',
    isSatisfied: false,
    notes: 'Registration in progress. Pending CAC issuance.',
  },
  {
    id: 2,
    title: 'Written Regulatory Position',
    description: 'Written regulatory position from National Ozone Office (NOO) / NESREA on handler registration, permits and storage.',
    isSatisfied: false,
    notes: 'Proposal submitted 27 October 2026. Awaiting official review.',
  },
  {
    id: 3,
    title: 'Named, Written-Accepted Destinations',
    description: 'Named, written-accepted destination for each cylinder category (reclamation vs destruction).',
    isSatisfied: false,
    notes: 'Unconfirmed; subject to NOO guidance.',
  },
  {
    id: 4,
    title: 'Committed Funding',
    description: 'Funds in hand or contractually committed for technician payments, logistics, and disposal.',
    isSatisfied: false,
    notes: 'Funding unsecured; seeking grants and partner support.',
  },
  {
    id: 5,
    title: 'Compliant Storage & Insurance',
    description: 'Compliant collection storage, dangerous goods transport protocols, and insurance in place.',
    isSatisfied: false,
    notes: 'Facility assessment pending in Lokoja.',
  },
];

export const INITIAL_SCORE_CRITERIA: ScoreCriterion[] = [
  {
    id: 'regulatory_clarity',
    title: 'Regulatory Clarity',
    maxWeight: 20,
    rating: 1, // 0 to 4
    notes: 'Proposal submitted to NOO; no formal permit yet.',
  },
  {
    id: 'disposal_route',
    title: 'Disposal & Reclamation Route',
    maxWeight: 20,
    rating: 1,
    notes: 'Destruction pathways in Nigeria under discussion.',
  },
  {
    id: 'funding_secured',
    title: 'Funding Secured',
    maxWeight: 20,
    rating: 1,
    notes: 'Pre-seed/grant applications active.',
  },
  {
    id: 'unit_economics',
    title: 'Unit Economics Proven',
    maxWeight: 15,
    rating: 2,
    notes: 'Model calibrated for ₦4,500/kg pilot incentive.',
  },
  {
    id: 'technician_demand',
    title: 'Technician Demand',
    maxWeight: 10,
    rating: 3,
    notes: 'Strong initial interest from Lokoja RAC workshops.',
  },
  {
    id: 'delivery_capacity',
    title: 'Delivery Capacity',
    maxWeight: 10,
    rating: 2,
    notes: 'Core project lead & field lead identified.',
  },
  {
    id: 'fraud_controls',
    title: 'Fraud & Data Controls',
    maxWeight: 5,
    rating: 4,
    notes: 'Hardware scales, gas identifiers & cryptographic custody audit implemented.',
  },
];

export const EQUIPMENT_TYPES = [
  'Split AC',
  'Refrigerator',
  'Freezer',
  'Cold room',
  'Vehicle AC',
  'Other',
] as const;
