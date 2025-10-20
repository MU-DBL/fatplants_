import type { SimulationNodeDatum } from 'd3-force';
import type { Attributes } from 'graphology-types';

export interface Message {
  id: number;
  answer: string;
  sources?: Source[];
  literatures?: Literature[];
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
  image:string;
  source: string;
  species: string;
  title: string;
}

export interface Relationship {
  id: string;
  name: string;
}

export interface Source {
  preview: string;
  name?: string;
  symbol?: string;
  position?: string;
  link: string;
  id: string;
}

export interface Literature {
  title: string;
  authors: string;
  journal: string;
  link: string| null;
}
