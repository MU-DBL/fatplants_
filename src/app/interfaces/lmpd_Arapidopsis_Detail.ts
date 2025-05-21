export interface Lmpd_Arapidopsis_Detail {
	annotation: string;
	entry_name: string;
	function: string;
    gene_names: string;
    keywords: string;
	length: string;
	organism: string;
	protein_names: string;
	status: string;
	subcellular_location: string;
    // entry: string;
}
export interface Lmpd_Arapidopsis_Detail_ID extends Lmpd_Arapidopsis_Detail {
	entry: string;
}