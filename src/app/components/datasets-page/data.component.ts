import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService } from '../../services/api/api.service';
import { FatPlantDataSource } from 'src/app/interfaces/FatPlantDataSource';
import { Soybean } from 'src/app/interfaces/Soybean';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  dataset: string = '';
  loading: boolean = false;
  arabidopsisDataSource!: MatTableDataSource<any>;
  camelinaDataSource!: MatTableDataSource<any>;
  soybeanDataSource!: MatTableDataSource<any>;
  cupheaDataSource!: MatTableDataSource<any>;
  pennycressDataSource!: MatTableDataSource<any>;
  fattyAcidDataSource!: MatTableDataSource<any>;
  showingSearch = false;
  currentPage = 1;
  searchQuery = '';
  resultsLength = 0;
  selectedFilterField = {
    name: "Gene Name",
    value: "gene_names"
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: APIService
  ) {
    this.route.paramMap.subscribe(params => {
      this.dataset = params.get('dataset') ?? '';
    });
  }

  get displayedColumns(): string[] {
    switch (this.dataset) {
      case "camelina":
        return ['camelina', 'refseq_id', 'protein_name', 'homeologs', 'cam_prot_entry'];
      case "soybean":
        return ['uniprot_id', 'refseq_id', 'glyma_id', 'gene_names', 'protein_name', 'soy_prot_entry'];
      case "cuphea":
        return ['protein_description', 'is_longest', 'cuphea_entry'];
      case "pennycress":
        return ['protein_description', 'is_longest', 'pennycress_entry'];
      case "fattyacid":
        return ['picture', 'lipidMapsID', 'name', 'mass', 'sofa_id', 'other_names', 'delta_notation'];
      default:
        return ['uniprot_id', 'refseq_id', 'tair_id', 'gene_names', 'protein_name', 'protein_entry'];
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['searchTerm'] ?? "";
      this.applySearchQuery();
    });
  }

  get currentDataSource(): MatTableDataSource<any> {
    switch (this.dataset) {
      case "camelina":
        return this.camelinaDataSource;
      case "soybean":
        return this.soybeanDataSource;
      case "cuphea":
        return this.cupheaDataSource;
      case "pennycress":
        return this.pennycressDataSource;
      case "fattyacid":
        return this.fattyAcidDataSource;
      default:
        return this.arabidopsisDataSource;
    }
  }

  changeDataset(newDataset: string) {
    this.router.navigate(["datasets/" + newDataset]);
    const encodedQuery = encodeURIComponent(this.searchQuery);

    switch (newDataset) {
      case "arabidopsis":
        this.apiService.searchSQLAPI(encodedQuery, "lmpd").subscribe(
          (data: any[]) => {
            this.arabidopsisDataSource = new MatTableDataSource<any>(data);
            this.arabidopsisDataSource.paginator = this.paginator;
          },
          () => {
            this.arabidopsisDataSource = new MatTableDataSource<any>([]);
            this.arabidopsisDataSource.paginator = this.paginator;
          }
        );
        break;
      case "camelina":
        this.apiService.searchSQLAPI(encodedQuery, "camelina").subscribe(
          (data: any[]) => {
            this.camelinaDataSource = new MatTableDataSource<any>(data);
            this.camelinaDataSource.paginator = this.paginator;
          },
          () => {
            this.camelinaDataSource = new MatTableDataSource<any>([]);
            this.camelinaDataSource.paginator = this.paginator;
          }
        );
        break;
      case "soybean":
        this.apiService.searchSQLAPI(encodedQuery, "soya").subscribe(
          (data: any[]) => {
            this.soybeanDataSource = new MatTableDataSource<any>(data);
            this.soybeanDataSource.paginator = this.paginator;
          },
          () => {
            this.soybeanDataSource = new MatTableDataSource<any>([]);
            this.soybeanDataSource.paginator = this.paginator;
          }
        );
        break;
      case "cuphea":
        this.apiService.searchSQLAPI(encodedQuery, "cuphea").subscribe(
          (data: any[]) => {
            this.cupheaDataSource = new MatTableDataSource<any>(data);
            this.cupheaDataSource.paginator = this.paginator;
          },
          () => {
            this.cupheaDataSource = new MatTableDataSource<any>([]);
            this.cupheaDataSource.paginator = this.paginator;
          }
        );
        break;
      case "pennycress":
        this.apiService.searchSQLAPI(encodedQuery, "pennycress").subscribe(
          (data: any[]) => {
            this.pennycressDataSource = new MatTableDataSource<any>(data);
            this.pennycressDataSource.paginator = this.paginator;
          },
          () => {
            this.pennycressDataSource = new MatTableDataSource<any>([]);
            this.pennycressDataSource.paginator = this.paginator;
          }
        );
        break;
      case "fattyacid":
        this.apiService.searchFattyAcid(encodedQuery).subscribe(
          (data: any[]) => {
            this.fattyAcidDataSource = new MatTableDataSource<any>(data);
            this.fattyAcidDataSource.paginator = this.paginator;
          },
          () => {
            this.fattyAcidDataSource = new MatTableDataSource<any>([]);
            this.fattyAcidDataSource.paginator = this.paginator;
          }
        );
        break;
    }
  }

  refreshData() {
    this.showingSearch = false;
    this.searchQuery = "";
    switch (this.dataset) {
      case "camelina":
        this.refreshCamelinaData();
        break;
      case "soybean":
        this.refreshSoybeanData();
        break;
      case "cuphea":
        this.refreshCupheaData();
        break;
      case "pennycress":
        this.refreshPennycressData();
        break;
      case "fattyacid":
        this.refreshFattyAcidData();
        break;
      default:
        this.refreshArapidopsisData();
        break;
    }
  }

  refreshArapidopsisData() {
    localStorage.removeItem('arabidopsis_data');
    this.arabidopsisDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getArabidopsisData();
  }

  refreshCamelinaData() {
    localStorage.removeItem('camelina_data');
    this.camelinaDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getCamelinaData();
  }

  refreshSoybeanData() {
    localStorage.removeItem('soybean_data');
    this.soybeanDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getSoybeanData();
  }

  refreshCupheaData() {
    localStorage.removeItem('cuphea_data');
    this.cupheaDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getCupheaData();
  }

  refreshPennycressData() {
    localStorage.removeItem('pennycress_data');
    this.pennycressDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getPennycressData();
  }

  refreshFattyAcidData() {
    localStorage.removeItem('fattyacid_data');
    this.fattyAcidDataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    this.getFattyAcidData();
  }

  getArabidopsisData() {
    this.apiService.getDataSetSamples("lmpd").subscribe(
      (data: any[]) => {
        this.arabidopsisDataSource = new MatTableDataSource<any>(data);
        this.arabidopsisDataSource.paginator = this.paginator;
        let arabidopsisData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };
        localStorage.setItem('arabidopsis_data', JSON.stringify(arabidopsisData));
        this.loading = false;
      }
    );
  }
  getCamelinaData() {
    this.apiService.getDataSetSamples("camelina").subscribe(
      (data: any[]) => {
        this.camelinaDataSource = new MatTableDataSource<any>(data);
        this.camelinaDataSource.paginator = this.paginator;

        let camelinaData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };

        camelinaData.data.forEach((e: any) => {
          e.homeologs = e.cs_id.split(',');
          e.cs_id = e.homeologs.shift();
        })

        localStorage.setItem('camelina_data', JSON.stringify(camelinaData));
        this.loading = false;
      }
    );
  }
  getSoybeanData() {
    this.apiService.getDataSetSamples("soya").subscribe(
      (data: any[]) => {
        this.soybeanDataSource = new MatTableDataSource<any>(data);
        this.soybeanDataSource.paginator = this.paginator;
        let soybeanData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };
        localStorage.setItem('soybean_data', JSON.stringify(soybeanData));
        this.loading = false;
      }
    );
  }

  getCupheaData() {
    this.apiService.getDataSetSamples("cuphea").subscribe(
      (data: any[]) => {
        this.cupheaDataSource = new MatTableDataSource<any>(data);
        this.cupheaDataSource.paginator = this.paginator;
        let cupheaData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };
        localStorage.setItem('cuphea_data', JSON.stringify(cupheaData));
        this.loading = false;
      }
    );
  }
  getPennycressData() {
    this.apiService.getDataSetSamples("pennycress").subscribe(
      (data: any[]) => {
        this.pennycressDataSource = new MatTableDataSource<any>(data);
        this.pennycressDataSource.paginator = this.paginator;
        let pennycressData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };
        localStorage.setItem('pennycress_data', JSON.stringify(pennycressData));
        this.loading = false;
      }
    );
  }
  getFattyAcidData() {
    this.apiService.getDataSetSamples("fatty_acid").subscribe(
      (data: any[]) => {
        this.fattyAcidDataSource = new MatTableDataSource<any>(data);
        this.fattyAcidDataSource.paginator = this.paginator;
        let fattyAcidData: FatPlantDataSource = {
          retrievalDate: Date.now(),
          data: data
        };
        localStorage.setItem('fattyacid_data', JSON.stringify(fattyAcidData));
        this.loading = false;
      }
    );
  }

  convertSoybeanData(data: Soybean[]) {
    data.forEach(value => {
      if (value.RefSeq == "") value.RefSeqList = [];
      else {
        value.RefSeqList = value.RefSeq.split(";");
        value.RefSeqList.splice(-1, 1); // removes empty string from list
      }
    });
    return data;
  }

  uniqueTairs(tairIds: string[]) {
    return [...new Set(tairIds.map(id => id.split('.')[0]))];
  }

  onSearchChange(query: any) {
    this.searchQuery = query.target.value;
  }

  applySearchQuery() {
    this.loading = true;
    this.showingSearch = true;
    const encodedQuery = encodeURIComponent(this.searchQuery);

    switch (this.dataset) {
      case "arabidopsis":
        this.apiService.searchSQLAPI(encodedQuery, "lmpd").subscribe(
          (data: any[]) => {
            this.arabidopsisDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.arabidopsisDataSource.paginator = this.paginator;
          },
          () => {
            this.arabidopsisDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.arabidopsisDataSource.paginator = this.paginator;
          }
        );
        break;
      case "camelina":
        this.apiService.searchSQLAPI(encodedQuery, "camelina").subscribe(
          (data: any[]) => {
            this.camelinaDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.camelinaDataSource.paginator = this.paginator;
          },
          () => {
            this.camelinaDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.camelinaDataSource.paginator = this.paginator;
          }
        );
        break;
      case "soybean":
        this.apiService.searchSQLAPI(encodedQuery, "soya").subscribe(
          (data: any[]) => {
            this.soybeanDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.soybeanDataSource.paginator = this.paginator;
          },
          () => {
            this.soybeanDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.soybeanDataSource.paginator = this.paginator;
          }
        );
        break;
      case "cuphea":
        this.apiService.searchSQLAPI(encodedQuery, "cuphea").subscribe(
          (data: any[]) => {
            this.cupheaDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.cupheaDataSource.paginator = this.paginator;
          },
          () => {
            this.cupheaDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.cupheaDataSource.paginator = this.paginator;
          }
        );
        break;
      case "pennycress":
        this.apiService.searchSQLAPI(encodedQuery, "pennycress").subscribe(
          (data: any[]) => {
            this.pennycressDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.pennycressDataSource.paginator = this.paginator;
          },
          () => {
            this.pennycressDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.pennycressDataSource.paginator = this.paginator;
          }
        );
        break;
      case "fattyacid":
        this.apiService.searchFattyAcid(encodedQuery).subscribe(
          (data: any[]) => {
            this.fattyAcidDataSource = new MatTableDataSource<any>(data);
            this.loading = false;
            this.fattyAcidDataSource.paginator = this.paginator;
          },
          () => {
            this.fattyAcidDataSource = new MatTableDataSource<any>([]);
            this.loading = false;
            this.fattyAcidDataSource.paginator = this.paginator;
          }
        );
        break;
    }
  }
}
