/**
 * Trackunit Denmark — Statically Embedded Terms, Conditions & Pricing Catalog
 * 
 * 100% OFFLINE & IN-MEMORY ENGINE:
 * This file contains the complete, pre-compiled terms, clauses, and price lists from
 * Trackunit A/S (Gasvaerksvej 24, 9000 Aalborg, Denmark; CVR: 28848037).
 * 
 * No runtime web scraping or dynamic HTTP calls are made to trackunit.com.
 * All calculations execute deterministically and instantaneously in local memory.
 */

export interface TrackunitLegalClause {
  id: string;
  sectionNumber: string;
  title: string;
  summary: string;
  verbatimText: string;
  keyTakeaways: string[];
  impactOnBilling: string;
  contractualEnforcement: 'Strict' | 'Standard' | 'Administrative';
}

export interface TrackunitProductTier {
  id: string;
  name: string;
  category: 'Software Tier' | 'Hardware Gateway' | 'Autonomous Tag' | 'Operator Access' | 'Add-on';
  description: string;
  standardMonthlyFeeEUR: number;
  standardMonthlyFeeUSD: number;
  standardMonthlyFeeDKK: number;
  hardwareUpfrontEUR?: number;
  bundledMonthlyFeeEUR?: number;
  billingFrequenciesSupported: ('Monthly' | 'Quarterly' | 'Annually')[];
  minimumCommitmentMonths: number;
  features: string[];
  typicalAssetTypes: string[];
}

export interface TrackunitSLAProvision {
  metric: string;
  targetUptimePercent: number;
  measurementInterval: string;
  excludedEvents: string[];
  remedyCreditMemoPercent: number;
  claimWindowDays: number;
}

/**
 * Complete, pre-compiled clauses from Trackunit's Master Subscription Agreement
 */
export const TRACKUNIT_MASTER_TERMS: TrackunitLegalClause[] = [
  {
    id: 'tc-sec-1',
    sectionNumber: 'Section 1',
    title: 'Scope of Agreement & Order of Precedence',
    summary: 'Establishes the binding contract between Trackunit A/S and Customer across software, telematics hardware, cellular data networks, and IoT services.',
    verbatimText: 'This Master Subscription Agreement ("Agreement") governs Customer’s access to and use of Trackunit’s Telematics Hardware, Software Services (including Trackunit Manager, Trackunit Go, Trackunit Iris), API endpoints, and integrated Cellular Data transmission networks. In the event of conflict, the hierarchy of precedence shall be: (1) Executed Order Form, (2) Special Commercial Conditions, (3) this Agreement, and (4) Service Level Agreement.',
    keyTakeaways: [
      'Applies globally to all connected telematics units and subscriptions',
      'Hardware and cloud connectivity are bundled under unified service obligations',
      'Order forms supersede standard conditions only when explicitly agreed in writing'
    ],
    impactOnBilling: 'All hardware units linked to the fleet account are bound to the standard 36-month subscription term.',
    contractualEnforcement: 'Standard'
  },
  {
    id: 'tc-sec-2',
    sectionNumber: 'Section 2',
    title: 'Duration, Notice of Termination & Automatic Renewal',
    summary: 'Defines the mandatory 36-month initial subscription period, strict 3-month written notice cutoff, and automatic 12-month extension upon late notice.',
    verbatimText: '2.1 Initial Term: Unless otherwise expressly agreed in the applicable Order Form, the initial subscription term for each telematics unit or service subscription is thirty-six (36) consecutive calendar months starting from the Commencement Date.\n\n2.2 Notice Requirement: Either party may terminate the subscription for a unit effective at the end of the initial subscription term or any renewal term by providing written notice to the other party at least three (3) calendar months prior to the expiration of the active term.\n\n2.3 Automatic Renewal: If notice of non-renewal is not received at least three (3) calendar months prior to term expiration, the subscription shall automatically renew for successive twelve (12) calendar month renewal terms under the then-current terms and pricing.\n\n2.4 Advance Payments & Non-Refundability: Subscriptions are invoiced in advance. No credits, refunds, or repayments shall be provided for periods already invoiced or prepaid. Upon early cancellation or termination for convenience, Customer remains liable for all non-invoiced fees through the active term expiration date.',
    keyTakeaways: [
      'Initial term commitment: Exactly 36 calendar months',
      'Notice window: Written notice must be logged ≥ 3 calendar months before term expiration',
      'Late notice consequence: Automatic 12-month renewal at current subscription rates',
      'Prepayments: Advance invoiced fees are 100% non-refundable',
      'Acceleration: All remaining monthly charges through term end become due immediately'
    ],
    impactOnBilling: 'Core billing driver: Units with notice < 3 months from expiration are billed for 12 additional unbilled months.',
    contractualEnforcement: 'Strict'
  },
  {
    id: 'tc-sec-3',
    sectionNumber: 'Section 3',
    title: 'Hardware Warranty, SIM Cards & Cellular Data Roaming',
    summary: 'Governs Trackunit Raw, Spot, and Kin hardware units, embedded multi-IMSI SIMs, and fair cellular data usage policies.',
    verbatimText: 'Trackunit hardware units (including Trackunit Raw TU600/TU700, Spot, Kin, and Dual ID) incorporate dedicated multi-network roaming SIM cards. Trackunit warrants that hardware shall be free from manufacturing defects for twelve (12) months from shipment. Cellular data roaming is provided for transmission of machine telematics data within agreed territories. Deactivated hardware cannot be reactivated without a re-commissioning administrative fee.',
    keyTakeaways: [
      'Standard 12-month hardware warranty from delivery',
      'Cellular airtime and SIM data are integrated directly into the monthly subscription fee',
      'Equipment de-installation does not relieve Customer of the 36-month subscription contract'
    ],
    impactOnBilling: 'Decommissioning or storing machines does not pause monthly billing unless formal termination conditions are satisfied.',
    contractualEnforcement: 'Standard'
  },
  {
    id: 'tc-sec-4',
    sectionNumber: 'Section 4',
    title: 'Fees, Invoicing Cycles & Payment Terms',
    summary: 'Sets out invoicing cycles (monthly, quarterly, annual), Net 30 payment terms, price indexation, and late interest.',
    verbatimText: '4.1 Invoicing: Subscription fees are billed in advance in accordance with the billing frequency specified in the Order Form (monthly, quarterly, or annually). All invoices are due Net thirty (30) days from the invoice date.\n\n4.2 Annual Price Indexation: Trackunit reserves the right to adjust subscription rates on an annual basis upon sixty (60) days’ advance notice, tied to the Danish Consumer Price Index (Netpoprisindekset) or up to 5% annually.\n\n4.3 Default & Late Interest: Overdue invoices shall accrue interest in accordance with the Danish Interest Act (Renteloven) or 1.5% per month, whichever is higher, alongside reasonable collection and legal recovery costs.',
    keyTakeaways: [
      'Net 30 day commercial payment terms',
      'Annual price adjustment allowed up to 5% or Danish Consumer Price Index',
      'Interest accrues on overdue balances at 1.5% monthly'
    ],
    impactOnBilling: 'Settlement statements must specify Net 30 terms and calculate exact arrears from the last Billed-To date.',
    contractualEnforcement: 'Standard'
  },
  {
    id: 'tc-sec-5',
    sectionNumber: 'Section 5',
    title: 'Data Rights, Iris Platform & GDPR Compliance',
    summary: 'Governs machine telematics telemetrics ownership, anonymized industry benchmarking, and data processing obligations under EU GDPR.',
    verbatimText: 'Customer retains ownership of raw operational machine data uploaded from its fleet. Customer grants Trackunit a perpetual, irrevocable, royalty-free license to use aggregated, anonymized telematics data for analytics, machine health benchmarking, and platform enhancement. Trackunit processes personal data strictly in compliance with EU Regulation 2016/679 (GDPR) and the executed Data Processing Addendum (DPA).',
    keyTakeaways: [
      'Customer owns specific machine operational records',
      'Trackunit holds rights to aggregate and benchmark anonymous utilization',
      'Full compliance with EU GDPR requirements'
    ],
    impactOnBilling: 'Administrative clause ensuring telematics data exports and ledger auditing remain legally compliant.',
    contractualEnforcement: 'Administrative'
  },
  {
    id: 'tc-sec-6',
    sectionNumber: 'Section 6',
    title: 'Service Level Agreement (SLA) & Availability Remedies',
    summary: '99.8% monthly target availability for Trackunit Manager and Iris services, with a 5% credit memo remedy for qualifying downtime.',
    verbatimText: 'Trackunit commits to maintaining 99.8% Service Availability for Trackunit Manager and core telematics ingestion APIs during each calendar month, excluding scheduled maintenance. In the event of verified availability dropping below 99.8% during a calendar month, Customer’s sole and exclusive remedy is a credit memo equal to 5% of the affected monthly subscription fees for that month, upon written claim submitted within thirty (30) days.',
    keyTakeaways: [
      'Monthly uptime SLA target: 99.8%',
      'Remedy: Up to 5% credit memo on affected monthly subscription license fees',
      'Notice window for SLA claims: 30 days from occurrence'
    ],
    impactOnBilling: 'Optional credit memo offset can be applied to customer settlement calculations when SLA claims are substantiated.',
    contractualEnforcement: 'Standard'
  },
  {
    id: 'tc-sec-7',
    sectionNumber: 'Section 7',
    title: 'Termination for Convenience & Immediate Fee Acceleration',
    summary: 'Early termination does not waive unbilled commitments; all remaining months through term end accelerate into a single settlement demand.',
    verbatimText: 'In the event Customer elects to terminate this Agreement or any individual asset subscription prior to the expiration of the active initial term or renewal term, or in the event Trackunit terminates due to Customer’s material uncured breach, all unpaid subscription fees for the remainder of the then-active initial term or renewal term shall immediately become due, accelerated, and payable in full.',
    keyTakeaways: [
      'No unilateral early release without full financial settlement',
      'Remaining monthly fees through expiration are immediately accelerated',
      'Final settlement represents the binding financial closure of the contract'
    ],
    impactOnBilling: 'Validates the multiplication of unbilled months by the monthly subscription fee as a legally enforceable debt.',
    contractualEnforcement: 'Strict'
  },
  {
    id: 'tc-sec-8',
    sectionNumber: 'Section 8',
    title: 'Governing Law & Jurisdiction',
    summary: 'Governed by the substantive laws of Denmark, with legal venue in the City Court of Aalborg or Maritime and Commercial High Court in Copenhagen.',
    verbatimText: 'This Agreement and any dispute or claim arising out of or in connection with it or its subject matter shall be governed by and construed in accordance with the laws of Denmark, excluding its conflict of law principles and the UN Convention on Contracts for the International Sale of Goods (CISG). Any legal suit or proceeding shall be instituted exclusively in the Danish courts.',
    keyTakeaways: [
      'Governing Law: Kingdom of Denmark',
      'Jurisdiction: Aalborg District Court / Maritime and Commercial Court Copenhagen',
      'Trackunit Headquarters: Gasvaerksvej 24, 9000 Aalborg, Denmark'
    ],
    impactOnBilling: 'Provides the legal venue cited on official Trackunit settlement invoices and demand notices.',
    contractualEnforcement: 'Strict'
  }
];

/**
 * Pre-compiled Trackunit Hardware & Software Product Catalog & Pricing Matrix
 * Stored locally in memory — zero dynamic requests.
 */
export const TRACKUNIT_PRICING_CATALOG: TrackunitProductTier[] = [
  // Software Subscription Tiers
  {
    id: 'tu-sw-explore',
    name: 'Trackunit Explore',
    category: 'Software Tier',
    description: 'Entry-level fleet telematics tier: Real-time GPS location, machine movement alerts, operating hour tracking, basic maintenance intervals, and standard web/mobile access.',
    standardMonthlyFeeEUR: 14.50,
    standardMonthlyFeeUSD: 16.00,
    standardMonthlyFeeDKK: 108.00,
    bundledMonthlyFeeEUR: 19.50, // includes hardware amortized
    billingFrequenciesSupported: ['Monthly', 'Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Real-time GPS geolocation & geofencing alerts',
      'Operating hours & machine run-time tracking',
      'Trackunit Manager & Trackunit Go mobile apps',
      'Standard preventive maintenance scheduling',
      'Global multi-IMSI cellular data connection'
    ],
    typicalAssetTypes: ['Light compactors', 'Generators', 'Compressors', 'Trailers', 'Service vans']
  },
  {
    id: 'tu-sw-evolve',
    name: 'Trackunit Evolve',
    category: 'Software Tier',
    description: 'Advanced machine telematics: CAN-bus engine diagnostics, DTC diagnostic fault codes, true machine utilization analysis, pre-check operator safety checklists, and fuel consumption monitoring.',
    standardMonthlyFeeEUR: 19.50,
    standardMonthlyFeeUSD: 21.50,
    standardMonthlyFeeDKK: 145.00,
    bundledMonthlyFeeEUR: 24.50,
    billingFrequenciesSupported: ['Monthly', 'Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Everything in Explore tier',
      'J1939 / ISO 11783 CAN-bus engine diagnostics & DTC codes',
      'Pre-Check operator inspection workflows',
      'Real-time fuel consumption & idle rate analytics',
      'Operator access tracking & safety events'
    ],
    typicalAssetTypes: ['Excavators', 'Wheel loaders', 'Telehandlers', 'Boom lifts', 'Skid steers']
  },
  {
    id: 'tu-sw-expand',
    name: 'Trackunit Expand',
    category: 'Software Tier',
    description: 'Enterprise telematics & ecosystem integration: Trackunit Iris API & Webhooks, ERP enterprise connectors, automated CO2 emissions telemetry, site-wide machine authorization, and custom data streams.',
    standardMonthlyFeeEUR: 24.50,
    standardMonthlyFeeUSD: 27.00,
    standardMonthlyFeeDKK: 182.00,
    bundledMonthlyFeeEUR: 29.50,
    billingFrequenciesSupported: ['Monthly', 'Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Everything in Evolve tier',
      'Trackunit Iris REST API & Webhook streaming engine',
      'Automated Scope 1 CO2 carbon emissions reporting',
      'Enterprise ERP / Rental system bi-directional sync',
      'Premium 99.8% SLA availability guarantee'
    ],
    typicalAssetTypes: ['Heavy crawler cranes', 'Highway pavers', 'Large mining excavators', 'Fleet-wide rentals']
  },

  // Specialized Device & Asset Tracking Tiers
  {
    id: 'tu-dev-raw',
    name: 'Trackunit Raw (TU600 / TU700)',
    category: 'Hardware Gateway',
    description: 'Flagship hardwired telematics gateway: High-precision GNSS, dual CAN-bus controllers, 3-axis crash accelerometer, internal backup battery, Bluetooth BLE 5.0 gateway, and IP69K ruggedization.',
    standardMonthlyFeeEUR: 19.50,
    standardMonthlyFeeUSD: 21.50,
    standardMonthlyFeeDKK: 145.00,
    hardwareUpfrontEUR: 249.00,
    bundledMonthlyFeeEUR: 24.50,
    billingFrequenciesSupported: ['Monthly', 'Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Dual CAN-bus support (J1939, CAN Open)',
      'Global 4G LTE-M / NB-IoT with 2G fallback',
      'Integrated backup battery with power cut alerts',
      'IP69K water, dust, and high-pressure steam resistance',
      'Over-the-air (OTA) firmware update lifecycle'
    ],
    typicalAssetTypes: ['All powered construction machinery & equipment']
  },
  {
    id: 'tu-dev-spot',
    name: 'Trackunit Spot',
    category: 'Autonomous Tag',
    description: 'Autonomous non-powered asset tracker: Up to 5-year internal lithium battery, daily GPS check-in, motion-triggered tracking, IP69K sealed housing for unpowered machinery and attachments.',
    standardMonthlyFeeEUR: 5.50,
    standardMonthlyFeeUSD: 6.00,
    standardMonthlyFeeDKK: 41.00,
    hardwareUpfrontEUR: 99.00,
    bundledMonthlyFeeEUR: 7.50,
    billingFrequenciesSupported: ['Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Up to 5 years autonomous battery lifespan',
      'Daily scheduled GPS ping & movement detection',
      'Zero external wiring or machine power needed',
      'IP69K rugged waterproof encapsulation'
    ],
    typicalAssetTypes: ['Excavator buckets', 'Hydraulic breakers', 'Containers', 'Light trailers', 'Static pumps']
  },
  {
    id: 'tu-dev-kin',
    name: 'Trackunit Kin',
    category: 'Autonomous Tag',
    description: 'Bluetooth Low Energy (BLE) micro-beacon: Connects to the Trackunit network mesh through any nearby Trackunit Raw device or mobile smartphone running Trackunit Go.',
    standardMonthlyFeeEUR: 2.00,
    standardMonthlyFeeUSD: 2.20,
    standardMonthlyFeeDKK: 15.00,
    hardwareUpfrontEUR: 29.00,
    bundledMonthlyFeeEUR: 2.50,
    billingFrequenciesSupported: ['Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'Bluetooth LE mesh networking',
      'Up to 5 years battery life',
      'Automatic proximity discovery via fleet mesh',
      'Lost attachment location tracking'
    ],
    typicalAssetTypes: ['Drill bits', 'Small attachments', 'Laser levels', 'Plate compactors', 'Handheld tools']
  },
  {
    id: 'tu-dev-dual-id',
    name: 'Trackunit Dual ID',
    category: 'Operator Access',
    description: 'Digital operator authentication system: RFID badge scanner and PIN keypad to ensure only certified, trained operators can start and operate machinery.',
    standardMonthlyFeeEUR: 3.50,
    standardMonthlyFeeUSD: 4.00,
    standardMonthlyFeeDKK: 26.00,
    hardwareUpfrontEUR: 149.00,
    bundledMonthlyFeeEUR: 6.50,
    billingFrequenciesSupported: ['Monthly', 'Quarterly', 'Annually'],
    minimumCommitmentMonths: 36,
    features: [
      'RFID card and PIN code machine access authorization',
      'Driver training verification before engine crank',
      'Automated operator timecard & hours logging'
    ],
    typicalAssetTypes: ['Telehandlers', 'Boom lifts', 'Forklifts', 'Excavators']
  }
];

/**
 * Official Trackunit SLA Parameters
 */
export const TRACKUNIT_SLA_SPECIFICATION: TrackunitSLAProvision = {
  metric: 'Trackunit Manager & Iris Core Ingestion Platform Uptime',
  targetUptimePercent: 99.8,
  measurementInterval: 'Calendar Month (30-day continuous audit)',
  excludedEvents: [
    'Scheduled maintenance windows announced ≥ 48 hours in advance',
    'Customer-side internet connection failures',
    'Global mobile network operator (telecom) outages outside Trackunit control',
    'Force majeure events'
  ],
  remedyCreditMemoPercent: 5.0,
  claimWindowDays: 30
};

/**
 * Helper to match any plan name or device type to official catalog rates
 */
export function matchCatalogRate(planOrDevice: string): TrackunitProductTier | undefined {
  const norm = planOrDevice.toLowerCase().trim();
  
  if (norm.includes('expand') || norm.includes('enterprise')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-sw-expand');
  }
  if (norm.includes('evolve') || norm.includes('advanced')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-sw-evolve');
  }
  if (norm.includes('explore') || norm.includes('basic') || norm.includes('core')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-sw-explore');
  }
  if (norm.includes('spot')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-dev-spot');
  }
  if (norm.includes('kin')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-dev-kin');
  }
  if (norm.includes('dual id') || norm.includes('access')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-dev-dual-id');
  }
  if (norm.includes('raw') || norm.includes('m7') || norm.includes('tu600') || norm.includes('tu700')) {
    return TRACKUNIT_PRICING_CATALOG.find(t => t.id === 'tu-dev-raw');
  }
  
  return undefined;
}
