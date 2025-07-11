import type { SimulationNodeDatum } from 'd3-force';
import type { Attributes } from 'graphology-types';


export interface Message {
  id: number;
  content: string ;
  sender: string;
}

export interface Species {
  id: number;
  name: string;
}

export interface Pathway {
  id: number;
  species: string;
  name: string;
  source: string;
}

export interface ForceSetting {
  linkDistance: number;
}

export interface NodeAttributes extends Attributes, SimulationNodeDatum {
  x: number;
  y: number;
  size?: number;
  label?: string;
  color?: string;
  ID?: string;
  description?: string;
  hidden?: boolean;
  type?: 'circle' | 'border' | 'highlight' | 'normal';
  highlighted?: boolean;
  borderColor?: string;
  borderSize?: number;
  zIndex?: number;
  clicked?: boolean;
}

export interface EdgeAttributes {
  size: number;
  color: string;
  score?: number;
  altColor?: string;
  forceLabel?: boolean;
  hidden?: boolean;
  zIndex?: number;
}



