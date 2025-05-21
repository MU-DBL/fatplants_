export interface Lmpd_Arapidopsis_Evidence {
	details: string;
	end: string;
	evidence: string;
    start: string;
    term: string;
    // uniprotID: string;
}
export interface Lmpd_Arapidopsis_Evidence_ID extends Lmpd_Arapidopsis_Evidence {
	uniprotID: string;
}