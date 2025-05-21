export interface G2SEntry {
    alignmentId: number; // int
    bitscore: number; // decimal
​​    chain: string; // A, B, C, ...
​​​    evalue: string; // scientific notation
​​​    identity: number; // int
​​    identityPositive: number; // int
    pdbFrom: number; // int
​​    pdbId: string;
​​    pdbNo: string;
​​​    pdbTo: number;
​​    seqFrom: number;
    seqTo: number;
}