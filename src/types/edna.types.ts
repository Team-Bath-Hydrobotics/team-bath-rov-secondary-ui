/**
 * Types for the eDNA Calculator feature.
 * MATE ROV 2026 Competition Task 2.5 - "Service the Holyrood subsea observatory"
 */

/**
 * A species entry with its observed count and calculated frequency.
 */
export interface SpeciesEntry {
  /** Unique identifier for the species */
  id: string;
  /** Common name of the species */
  commonName: string;
  /** Scientific name (Latin binomial) */
  scientificName: string;
  /** Number of individuals observed (user input) */
  numberSeen: number | null;
  /** Calculated % frequency = (numberSeen / totalCount) * 100 */
  percentFrequency: number | null;
}

/**
 * State for the eDNA calculator.
 */
export interface EdnaCalculatorState {
  /** Array of species with their counts and frequencies */
  species: SpeciesEntry[];
  /** Whether calculation has been performed */
  isCalculated: boolean;
  /** Total count of all species (sum of numberSeen) */
  totalCount: number;
  /** Sum of all percentages (should equal ~100% as verification) */
  percentageSum: number | null;
}
