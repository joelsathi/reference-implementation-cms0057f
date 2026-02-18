/**
 * FHIR R4 Claim Item and ClaimResponse Type Definitions
 * Based on HL7 FHIR ClaimResponse Resource
 * https://hl7.org/fhir/R4/claimresponse.html
 */

import type { Coding, Quantity, Reference, Attachment } from './questionnaire';

/**
 * Adjudication category codes from FHIR ValueSet
 * http://hl7.org/fhir/ValueSet/adjudication
 */
export type AdjudicationCode =
  | 'submitted'      // The total submitted amount for the claim or group or line item
  | 'copay'          // Patient Co-Payment
  | 'eligible'       // Amount of the change which is considered for adjudication
  | 'deductible'     // Amount deducted from the eligible amount prior to adjudication
  | 'unallocdeduct'  // The amount of deductible which could not allocated to other line items
  | 'eligpercent'    // Eligible Percentage
  | 'tax'            // The amount of tax
  | 'benefit';       // Amount payable under the coverage

/**
 * Display names for adjudication codes
 */
export const AdjudicationCodeDisplay: Record<AdjudicationCode, string> = {
  submitted: 'Submitted Amount',
  copay: 'CoPay',
  eligible: 'Eligible Amount',
  deductible: 'Deductible',
  unallocdeduct: 'Unallocated Deductible',
  eligpercent: 'Eligible %',
  tax: 'Tax',
  benefit: 'Benefit Amount',
};

/**
 * Descriptions for adjudication codes
 */
export const AdjudicationCodeDescription: Record<AdjudicationCode, string> = {
  submitted: 'The total submitted amount for the claim or group or line item.',
  copay: 'Patient Co-Payment amount.',
  eligible: 'Amount of the charge which is considered for adjudication.',
  deductible: 'Amount deducted from the eligible amount prior to adjudication.',
  unallocdeduct: 'The amount of deductible which could not be allocated to other line items.',
  eligpercent: 'Eligible Percentage for the service.',
  tax: 'The amount of tax applicable.',
  benefit: 'Amount payable under the coverage.',
};

/**
 * Process note type
 */
export type ProcessNoteType = 'display' | 'print' | 'printoper';

/**
 * Process note for adjudication
 */
export interface ProcessNote {
  /** Note instance identifier */
  number?: number;
  /** display | print | printoper */
  type?: ProcessNoteType;
  /** Note explanatory text */
  text: string;
  /** Language of the text */
  language?: Coding;
}

/**
 * Item adjudication details
 */
export interface ItemAdjudication {
  /** Type of adjudication information */
  category: AdjudicationCode;
  /** Explanation of adjudication outcome */
  reason?: Coding;
  /** Monetary amount */
  amount?: {
    value: number;
    currency: string;
  };
  /** Non-monetary value (e.g., percentage) */
  value?: number;
}

/**
 * FHIR Questionnaire Response (simplified)
 */
export interface QuestionnaireResponseItem {
  linkId: string;
  text?: string;
  answer?: Array<{
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDecimal?: number;
    valueDate?: string;
    valueDateTime?: string;
    valueCoding?: Coding;
    valueQuantity?: Quantity;
    valueReference?: Reference;
    valueAttachment?: Attachment;
  }>;
  item?: QuestionnaireResponseItem[];
}

/**
 * Document Reference (for attachments like PDF, DICOM, PNG)
 */
export interface DocumentReference {
  id: string;
  /** Type of document */
  type?: Coding;
  /** Human readable description */
  description?: string;
  /** When the document was created */
  date?: string;
  /** Content details */
  content: Array<{
    attachment: Attachment;
    format?: Coding;
  }>;
}

/**
 * Observation resource reference
 */
export interface ObservationReference {
  id: string;
  code: Coding;
  display?: string;
  valueString?: string;
  valueQuantity?: Quantity;
  valueCodeableConcept?: Coding;
  effectiveDateTime?: string;
}

/**
 * Medication Request reference
 */
export interface MedicationRequestReference {
  id: string;
  medicationCodeableConcept?: Coding;
  medicationReference?: Reference;
  dosageInstruction?: string;
  status: string;
}

/**
 * Patient Event dates (service dates, admission/discharge)
 */
export interface PatientEventDates {
  /** Start date of the event/service */
  eventStartDate?: string;
  /** End date of the event/service */
  eventEndDate?: string;
  /** Admission date (for inpatient) */
  admissionDate?: string;
  /** Discharge date (for inpatient) */
  dischargeDate?: string;
  /** Expected discharge date (if not yet discharged) */
  expectedDischargeDate?: string;
}

/**
 * FHIR Resource references that may be linked from questionnaire responses
 */
export interface LinkedFHIRResources {
  observations?: ObservationReference[];
  medicationRequests?: MedicationRequestReference[];
  documentReferences?: DocumentReference[];
  otherReferences?: Reference[];
}

/**
 * AI Analysis result for items with questionnaire responses
 */
export interface AIAnalysis {
  /** Recommended action */
  recommendation: 'approve' | 'deny' | 'review';
  /** Confidence score (0-100) */
  confidenceScore: number;
  /** Summary of the clinical analysis */
  summary: string;
  /** Detailed criteria matches */
  criteriaMatches?: Array<{
    criteria: string;
    met: boolean;
    details?: string;
  }>;
  /** Risk assessment */
  riskLevel?: 'low' | 'medium' | 'high';
  /** Policy reference if applicable */
  policyReference?: string;
}

/**
 * Individual claim item that may be part of a claim request
 */
export interface ClaimItem {
  /** Item sequence number */
  sequence: number;
  /** Product or service code */
  productOrService: Coding;
  /** Description of the item */
  description?: string;
  /** Quantity of the item */
  quantity?: Quantity;
  /** Unit price */
  unitPrice?: {
    value: number;
    currency: string;
  };
  /** Net total for this item */
  net?: {
    value: number;
    currency: string;
  };
  /** Date(s) of service */
  servicedDate?: string;
  servicedPeriod?: {
    start?: string;
    end?: string;
  };
  /** Patient event dates (admission, discharge, etc.) */
  patientEventDates?: PatientEventDates;
  /** Questionnaire response for this item (if applicable) */
  questionnaireResponse?: {
    questionnaireId: string;
    questionnaireName?: string;
    items: QuestionnaireResponseItem[];
  };
  /** Linked FHIR resources from questionnaire answers */
  linkedResources?: LinkedFHIRResources;
  /** AI analysis for this item (present when questionnaireResponse exists) */
  aiAnalysis?: AIAnalysis;
  /** Current adjudication status and details */
  adjudication?: ItemAdjudication[];
  /** Note numbers linked to this item */
  noteNumbers?: number[];
  /** Review notes for this specific item */
  reviewNote?: string;
}

/**
 * Complete claim request with all items
 */
export interface ClaimRequest {
  /** Claim identifier */
  id: string;
  /** Claim status */
  status: 'pending' | 'approved' | 'denied' | 'partial';
  /** Claim type (e.g., institutional, professional) */
  type: Coding;
  /** Claim use (claim, preauthorization, predetermination) */
  use: 'claim' | 'preauthorization' | 'predetermination';
  /** Patient reference */
  patient: Reference;
  /** Created date */
  created: string;
  /** Provider/facility reference */
  provider: Reference;
  /** Priority of the request */
  priority?: Coding;
  /** All claim items */
  items: ClaimItem[];
  /** Process notes for the entire claim */
  processNotes?: ProcessNote[];
  /** Total amounts */
  total?: {
    submitted?: { value: number; currency: string };
    eligible?: { value: number; currency: string };
    benefit?: { value: number; currency: string };
  };
}

/**
 * Claim item with adjudication state for UI editing
 */
export interface ClaimItemWithAdjudicationState extends ClaimItem {
  /** Currently selected adjudication code for this item */
  selectedAdjudicationCode?: AdjudicationCode;
  /** Amount entered for this item's adjudication */
  adjudicationAmount?: number;
  /** Percentage entered (for eligpercent) */
  adjudicationPercent?: number;
  /** Review note for this specific item */
  itemReviewNote: string;
  /** Whether item has been reviewed */
  isReviewed: boolean;
}
