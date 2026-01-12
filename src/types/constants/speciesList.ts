import type { SpeciesEntry } from '../edna.types';

/**
 * Pre-populated species list for MATE ROV 2026 Competition Task 2.5
 * "Service the Holyrood subsea observatory"
 *
 * Species names are read-only and in the exact order specified in the competition manual.
 */
export const SPECIES_LIST: Omit<SpeciesEntry, 'numberSeen' | 'percentFrequency'>[] = [
  { id: 'snow_crab', commonName: 'Snow crab', scientificName: 'Chionoecetes opilio' },
  { id: 'acadian_hermit', commonName: 'Acadian hermit crab', scientificName: 'Pagarus acadianus' },
  {
    id: 'hairy_hermit',
    commonName: 'Western Atlantic Hairy Hermit Crab',
    scientificName: 'Pagarus arcuatus',
  },
  { id: 'green_crab', commonName: 'European Green Crab', scientificName: 'Carcinus maenas' },
  { id: 'rock_crab', commonName: 'Rock Crab', scientificName: 'Cancer pagurus' },
  { id: 'jonah_crab', commonName: 'Jonah Crab', scientificName: 'Cancer borealis' },
  { id: 'spiny_sunstar', commonName: 'Spiny Sunstar', scientificName: 'Crossaster papposus' },
  {
    id: 'sea_urchin',
    commonName: 'Sea Urchin',
    scientificName: 'Strongylocentrotus droebachiensis',
  },
  { id: 'boreal_sea_star', commonName: 'Boreal Sea Star', scientificName: 'Asterias vulgaris' },
  {
    id: 'daisy_brittle_star',
    commonName: 'Daisy brittle star',
    scientificName: 'Ophiopholis aculeata',
  },
];

export const SPECIES_COUNT = SPECIES_LIST.length;

/**
 * Creates initial species entries with null values for user input.
 */
export const createInitialSpeciesEntries = (): SpeciesEntry[] =>
  SPECIES_LIST.map((species) => ({
    ...species,
    numberSeen: null,
    percentFrequency: null,
  }));
