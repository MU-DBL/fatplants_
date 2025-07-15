import type { SimulationNodeDatum } from 'd3-force';
import type { Attributes } from 'graphology-types';

export interface Message {
  id: number;
  content: string ;
  sender: string;
  isError?: boolean,
  isLoading?: boolean;
}

export interface Species {
  id: string;
  name: string;
}

export interface PathwayDropdown {
  id: string;
  species: string;
  name: string;
  source: string;
}