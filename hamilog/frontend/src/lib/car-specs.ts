// =============================================================================
// Hamilog Car Specs — Client-side mirror of backend CAR_SPECS
// =============================================================================
// This matches the CAR_SPECS dict in missions_DB_module.py exactly.
// Used by the dispatcher UI to display vehicle capacity info without extra API calls.

import type { CarType } from './types';

export interface CarSpec {
  max_weight: number;   // kg
  max_volume: number;   // liters
  cooling: boolean;
  label: string;        // Human-readable name
  icon: string;         // Emoji icon
}

export const CAR_SPECS: Record<CarType, CarSpec> = {
  sedan: {
    max_weight: 50,
    max_volume: 200,
    cooling: false,
    label: 'Sedan',
    icon: '🚗',
  },
  suv: {
    max_weight: 150,
    max_volume: 600,
    cooling: false,
    label: 'SUV',
    icon: '🚙',
  },
  van: {
    max_weight: 500,
    max_volume: 2000,
    cooling: false,
    label: 'Van',
    icon: '🚐',
  },
  refrigerated_van: {
    max_weight: 400,
    max_volume: 1500,
    cooling: true,
    label: 'Refrigerated Van',
    icon: '🧊',
  },
};
