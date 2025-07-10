export interface Species {
  id: number;
  name: string;
}

export interface Pathway {
  id: number;
  name: string;
  source: string;
}

export interface ForceSettings {
  linkDistance: number;
  chargeStrength?: number;
  collideRadiusFactor?: number;
}

export interface ForceWorker {
  start: () => void;
  stop: () => void;
}

export interface NodeAttributes {
  x: number;
  y: number;
  size: number;
  label?: string;
  color: string;
  ID: string;
  labelProp?: NodeLabelProperties; // Custom property for label size
}

export interface EdgeAttributes {
  size: number;
  color: string;
}

export interface NodeLabelProperties {
  size?: number; // Font size of the label
  color?: string; // Color of the label text
  [key: string]: any; // Allow for other custom label attributes
}



