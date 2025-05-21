import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from "rxjs";
import { HttpClient } from '@angular/common/http';
import { Lmpd_Arapidopsis } from 'src/app/interfaces/lmpd_Arapidopsis';
import { APIService } from '../../services/api/api.service';

@Component({
  selector: 'app-glmol-structure-page',
  templateUrl: './glmol-structure-page.component.html',
  styleUrls: ['./glmol-structure-page.component.scss']
})
export class GlmolStructurePageComponent implements OnInit {

  @ViewChild('scroll') private myScrollContainer!: ElementRef;

  pdbs: Array<{ name: string, url: SafeResourceUrl }> = [];
  public items!: Observable<Lmpd_Arapidopsis[]>;

  nopdb = false;
  noRes = false;
  hasSearched = false;

  isGlmol = false;
  glmolID = "";
  searchQuery = "";
  displayedGeneColumns = ["uniprot_id", "geneName", "proteinNames"];

  relatedGeneNames: any[] = [];
  selectedFPID = "";
  selectedUniProt = "";
  loading = false;

  species = [
    { name: "Arabidopsis", value: "lmpd" },
    { name: "Camelina", value: "camelina" },
    { name: "Soybean", value: "soya" }
  ];
  selectedSpecies = this.species[0].value;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private apiService: APIService
  ) { }

  ngOnInit() { }

  Glmol() {
    this.loading = true;
    this.hasSearched = false;
    this.isGlmol = false;
    this.pdbs = [];
    this.nopdb = false;
    this.searchQuery = this.glmolID;
    this.relatedGeneNames = [];

    this.apiService.searchSQLAPI(this.glmolID, this.selectedSpecies).subscribe(
      (data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          if (data.length > 1) {
            this.relatedGeneNames = data.slice(0, 10);
          }
          this.noRes = false;
          this.selectedFPID = data[0].fp_id;
          this.selectedUniProt = data[0].uniprot_id;
          this.searchG2S(this.selectedUniProt);
          this.isGlmol = true;
        } else {
          this.hasSearched = true;
          this.nopdb = true;
          this.noRes = true;
          this.loading = false;
        }
      },
      error => {
        this.hasSearched = true;
        this.nopdb = true;
        this.noRes = true;
        this.loading = false;
      }
    );
  }

  // load pdb url from alphafold
  searchG2S(pdb: string) {
    this.loading = true;
    this.http.get<any[]>(`https://alphafold.ebi.ac.uk/api/prediction/${pdb}`).subscribe(
      (result: any[]) => {
        if (Array.isArray(result) && result.length >= 1) {
          let defaultPdb = this.SafeUrl(result[0].pdbUrl);
          this.pdbs.push({ name: pdb, url: defaultPdb });
          this.nopdb = false;
        }
        this.nopdb = this.pdbs.length === 0;
        this.loading = false;
        this.hasSearched = true;
        if (!this.nopdb) {
          setTimeout(() => { this.scroll(); }, 100);
        }
      },
      error => {
        this.nopdb = true;
        this.loading = false;
      }
    );
  }

  SafeUrl(input: string): SafeResourceUrl {
    const tmpurl = '/static/viewer.html?' + input;
    return this.sanitizer.bypassSecurityTrustResourceUrl(tmpurl);
  }

  setDefaultSearch() {
    this.glmolID = "P46086";
  }

  scroll(): void {
    try {
      this.myScrollContainer.nativeElement.scrollIntoView({ behavior: "smooth" });
    } catch (err) { }
  }

  changeSpecies(e: any) {
    this.selectedSpecies = e.value;
  }

  selectColumn(uniprot_id: string, fp_id: string) {
    this.pdbs = [];
    this.nopdb = false;
    this.loading = true;
    this.hasSearched = false;
    this.selectedFPID = fp_id;
    this.selectedUniProt = uniprot_id;
    this.searchG2S(this.selectedUniProt);
    this.isGlmol = true;
  }
}
