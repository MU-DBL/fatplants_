import { Component, OnInit, Input, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FunctionEntry } from 'src/app/interfaces/FunctionEntry';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { APIService } from '../../services/api/api.service';
import { GptDialogComponent } from 'src/app/components/commons/gpt-dialog/gpt-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from "../../services/blast_data/data.service";
import { Location } from '@angular/common';
import { MatStep } from '@angular/material/stepper';
import { HttpClient } from "@angular/common/http";
import { G2SEntry } from "../../interfaces/G2SEntry";
import { DomSanitizer } from "@angular/platform-browser";
import { StructureViewerComponent } from '../commons/structure-viewer/structure-viewer.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ClipboardService } from 'ngx-clipboard';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-protein-details-page',
  templateUrl: './protein-details-page.component.html',
  styleUrls: ['./protein-details-page.component.scss']
})
export class ProteinDetailsPageComponent implements OnInit {

  uniprot_id!: string;
  proteinDatabase: any;
  speciesName!: string;
  baseDetails: any;
  extendedData: any;

  database!: string;
  sequence!: string;
  private cfg!: string;
  translationObject: any;
  uniprotId: any;
  arapidopsisData: any;
  proteinData: any;
  proteinEntry: any;
  functions!: FunctionEntry[];
  isLoadingArapidopsis = true;
  proteinDataSource!: MatTableDataSource<FunctionEntry>;
  isLoadingProtein = true;
  isSummary = false;
  is3DStructure = false;
  isStructure = false;
  isBlast = false;
  isPathway = false;
  showPsiBlastTab = false;
  showAligmentsTab = false;
  showStructrueTab = false;
  showPathwayTab = false;
  showSummaryTab = false;
  showSimpleSummaryTab = false;
  percent = 0;
  private intervalId: any;
  showProgress = false;
  pathwayList: string[] = [];
  noimg = false;
  pathwayLoading = false;
  leftArrowEnabled = false;
  rightArrowEnabled = true;
  showBlastResList: any[] = [];
  showPSIBlastResList: any[] = [];
  showFilterBlastResList: any[] = [];
  showFilterPSIBlastResList: any[] = [];
  loadedDatabase: any;
  selectedGPTQuery = "";
  splitGeneNames: string[] = [];
  homologs: any = null;
  noPdb = false;
  G2SDataSource!: MatTableDataSource<G2SEntry>;
  defaultPdb: any;
  isLoadingImage = false;
  selectedPathImage: string | null = null;

  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;
  context!: CanvasRenderingContext2D;
  currPath!: string;
  displayedColumns = ['entryId', 'gene', 'uniprotAccession', 'taxId', 'uniprotStart', 'uniprotEnd', '3DViewer'];
  Databases: any;
  query = "Fucosyltransferase";
  fp_id: string | null = null;
  searchError = false;
  loadingSearch = false;
  hasSearched = false;
  headingName = "";
  BlastFilterValue: number = 70;
  PSIBlastFilterValue: number = 70;

  constructor(
    private route: ActivatedRoute,
    public dataService: DataService,
    private location: Location,
    private cdr: ChangeDetectorRef,
    public notificationService: NotificationService,
    public dialog: MatDialog,
    private apiService: APIService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    public clipboardService: ClipboardService,
    private db: APIService
  ) {}

  get g2sLoading(): boolean {
    return this.dataService.g2sLoading;
  }

  get prettyConfig(): string {
    if (this.cfg != undefined) return this.cfg[0].toUpperCase() + this.cfg.slice(1);
    else return "";
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.isSummary = false;
      this.is3DStructure = false;
      this.isStructure = false;
      this.isBlast = false;
      this.isPathway = false;

      if (!this.uniprot_id) this.uniprot_id = params['uniprot_id'];
      if (!this.cfg) this.cfg = "summary";
      this.database = params['database_name'];

      if(this.isCupheaPennycress(this.database)){
        this.showTabForCupheaPennycress(true);
        this.apiService.getExtendedDetails(this.uniprot_id, this.database.toLowerCase()).subscribe(res => {
          if (res && res[0]) {
            this.extendedData = res[0];
            this.sequence = this.extendedData.sequence;
            this.extendedData.staus = "unreviewed";
            this.headingName = this.extendedData.description;
            this.dataService.BlastNeedUpdate = true;
          }
        });
        return;
      } else {
        this.showTabForCupheaPennycress(false);
      }

      this.hasSearched = true;
      this.http.get('/static/json_config/Databases.json', { responseType: 'json' }).subscribe(data => {
        this.Databases = data;
        this.proteinDatabase = this.Databases[this.database];
        this.speciesName = this.proteinDatabase['fullSearchSpecies'];

        this.apiService.getBaseProteinFromUniProt(this.uniprot_id, this.proteinDatabase["fullSearchSpecies"]).subscribe((data: any) => {
          this.validateResult(data[0]);
          this.getExtendedSpecies();
        });
      });
    });
  }

  ngOnChanges() {
    this.route.params.subscribe(params => {
      this.isSummary = false;
      this.is3DStructure = false;
      this.isStructure = false;
      this.isBlast = false;
      this.isPathway = false;

      if (!this.uniprot_id) this.uniprot_id = params['uniprot_id'];
      if (!this.cfg) this.cfg = "summary";
      this.database = params['database_name'];

      if(this.isCupheaPennycress(this.database)){
        this.showTabForCupheaPennycress(true);
      }

      this.showTabForCupheaPennycress(false);

      this.hasSearched = true;
      this.http.get('/static/json_config/Databases.json', { responseType: 'json' }).subscribe(data => {
        this.Databases = data;
        this.proteinDatabase = this.Databases[this.database];
        this.speciesName = this.proteinDatabase['fullSearchSpecies'];

        this.apiService.getBaseProteinFromUniProt(this.uniprot_id, this.proteinDatabase["fullSearchSpecies"]).subscribe((data: any) => {
          this.validateResult(data[0]);
          this.getExtendedSpecies();
        });
      });
    });
  }

  copyToClipboard(sequence_data: string) {
    this.clipboardService.copyFromContent(sequence_data);
    this.notificationService.popup('Copied to Clipboard!');
  }

  tabChanged(event: MatTabChangeEvent): void {
    switch (this.cfg) {
      case 'summary':
        this.isSummary = false;
        break;
      case 'alignments':
        this.is3DStructure = false;
        break;
      case 'structure':
        this.isStructure = false;
        break;
      case 'blast':
        this.isBlast = false;
        break;
      default:
        this.isPathway = false;
        break;
    }

    switch (event.index) {
      case 0:
        this.cfg = "summary";
        break;
      case 1:
        this.cfg = this.isCupheaPennycress(this.database) ? "blast" : "alignments";
        break;
      case 2:
        this.cfg = this.isCupheaPennycress(this.database) ? "psi_blast" : "structure";
        break;
      case 3:
        this.cfg = "blast";
        break;
      case 4:
        this.cfg = "pathway";
        break;
      default:
        this.cfg = "summary";
        break;
    }

    this.cdr.detectChanges();
    this.location.replaceState(`/details/${this.database}/` + this.uniprot_id + `/` + this.cfg);
    this.SelectConfig();
  }

  validateResult(result: any): boolean {
    console.log("result uniprot : ", result);
    this.loadingSearch = false;
    this.baseDetails = [];
    this.uniprot_id = "";
    this.fp_id = null;
    this.cdr.detectChanges();

    if (result == undefined) {
      this.searchError = true;
      this.location.replaceState(`details/${this.database}/`);
      this.cdr.detectChanges();
      return false;
    } else {
      console.log("validate result data : ", result);
      if (!result.fp_id) {
        this.apiService.getBaseProteinFromUniProt(result.uniprot_id, this.proteinDatabase['fullSearchSpecies']).subscribe((data: any[]) => {
          if (data && data.length > 0) {
            this.uniprot_id = data[0].uniprot_id;
            this.location.replaceState(`details/${this.database}/` + this.uniprot_id + `/summary`);
            this.baseDetails = data[0];
            this.cdr.detectChanges();
            return true;
          }
          return false;
        });
      }

      this.uniprot_id = result.uniprot_id;
      this.location.replaceState(`details/${this.database}/` + this.uniprot_id + `/summary`);
      this.baseDetails = result;
      this.cdr.detectChanges();
      return true;
    }
  }

  getExtendedSpecies() {
    this.homologs = null;
    this.sequence = "";
    this.dataService.loading = true;
    console.log("result is : ", "nothing");
    console.log(this.baseDetails.fp_id);
    this.apiService.getExtendedDetails(this.baseDetails.fp_id, this.speciesName).subscribe(res => {
      this.SelectConfig();
      if (res && res[0]) {
        this.extendedData = res[0];
        this.splitGeneNames = this.extendedData.gene_names.split(' ');
        this.sequence = this.extendedData.sequence;
        this.selectedGPTQuery = this.splitGeneNames[0];
        if (this.database === "Arabidopsis") this.headingName = this.extendedData.protein_names;
        else this.headingName = this.extendedData.protein_name;
        this.noPdb = false;
        this.dataService.loading = false;
        this.dataService.BlastNeedUpdate = true;
        this.noPdb = false;
        this.searchG2S();
      }
    });

    if (this.speciesName === "lmpd") {
      this.apiService.searchSpeciesMapper("arabidopsis", encodeURIComponent(this.baseDetails.uniprot_id)).subscribe((data: any[]) => {
        if (data && data.length > 0) {
          this.homologs = data[0];
        }
      });
    } else if (this.speciesName === "camelina") {
      this.apiService.searchSpeciesMapper("camelina", encodeURIComponent(this.baseDetails.uniprot_id)).subscribe((data: any[]) => {
        if (data && data.length > 0) {
          this.homologs = data[0];
        }
      });
    } else if (this.speciesName === "soya") {
      this.apiService.searchSpeciesMapper("glymine_max", encodeURIComponent(this.baseDetails.uniprot_id)).subscribe((data: any[]) => {
        if (data && data.length > 0) {
          this.homologs = data[0];
        }
      });
    }
  }

  searchG2S() {
    this.dataService.g2sLoading = true;
    this.http.get(`https://alphafold.ebi.ac.uk/api/prediction/${this.uniprot_id}?key=AIzaSyCeurAJz7ZGjPQUtEaerUkBZ3TaBkXrY94`).subscribe((result: any) => {
      this.G2SDataSource = new MatTableDataSource(result);
      if (result != undefined && result.length >= 1) {
        this.defaultPdb = this.sanitizer.bypassSecurityTrustResourceUrl("/static/display3d.html?pdbId=" + result[0].pdbUrl);
        this.noPdb = false;
      }

      this.dataService.g2sLoading = false;
    }, error => {
      this.dataService.g2sLoading = false;
    });
  }

  openGptDialog() {
    this.dialog.open(GptDialogComponent, {
      data: { identifier: this.selectedGPTQuery }
    });
  }

  parseKeywords(originalKeywords: string): string {
    const keywordList = originalKeywords.split(';');
    return keywordList.map((keyword, i) =>
      i === keywordList.length - 1 ? keyword : keyword + ', '
    ).join('');
  }

  getAlternativeNames(altNames: string[]): string {
    return altNames.map((name, i) =>
      i === altNames.length - 1 ? name : name + ', '
    ).join('');
  }

  selectGPTOption(selection: any) {
    this.selectedGPTQuery = selection.value;
  }

  changeConfig(newConfig: string) {
    newConfig = newConfig.toLowerCase();
    switch (this.cfg) {
      case 'summary':
        this.isSummary = false;
        break;
      case 'alignments':
        this.is3DStructure = false;
        break;
      case 'structure':
        this.isStructure = false;
        break;
      case 'blast':
        this.isBlast = false;
        break;
      default:
        this.isPathway = false;
        break;
    }
    this.cfg = newConfig;
    this.cdr.detectChanges();
    this.location.replaceState(`/details/${this.database}/` + this.uniprot_id + `/` + this.cfg);

    this.SelectConfig();
  }

  SelectConfig() {
    switch (this.cfg) {
      case 'summary':
        this.isSummary = true;
        break;
      case 'structure':
        this.isStructure = true;
        break;
      case 'alignments':
        this.is3DStructure = true;
        break;
      case 'blast':
        if (!this.dataService.BlastNeedUpdate && this.dataService.getBlastRes()) {
          this.SplitRes(this.dataService.getBlastRes());
          this.isBlast = true;
        } else {
          this.percent = 0;
          const getDownloadProgress = () => {
            if (this.percent <= 99) {
              this.percent += 10;
            } else {
              clearInterval(this.intervalId);
            }
          };
          this.intervalId = setInterval(getDownloadProgress, 700);
          this.isBlast = true;
          this.showProgress = true;
          if (!this.proteinDatabase) {
            this.proteinDatabase = 'Arabidopsis';
          }

          if (this.isCupheaPennycress(this.database)) {
            this.showBlastResList = [];
            this.apiService.getblast('arabidopsis', this.sequence, "").subscribe(res => this.SplitRes(res));
            this.apiService.getblast('camelina', this.sequence, "").subscribe(res => this.SplitRes(res));
            this.apiService.getblast('soybean', this.sequence, "").subscribe(res => this.SplitRes(res));
            this.showProgress = false;
            this.dataService.updateBlastResult(this.showBlastResList);
          } else {
            this.showBlastResList = [];
            this.apiService.getblast(this.database.toLowerCase(), this.sequence, "").subscribe(res => {
              this.SplitRes(res);
              this.showProgress = false;
              clearInterval(this.intervalId);
              this.dataService.updateBlastResult(res);
            });
          }
        }
        break;
      case 'psi_blast':
        this.percent = 0;
        const getDownloadProgress = () => {
          if (this.percent <= 99) {
            this.percent += 10;
          } else {
            clearInterval(this.intervalId);
          }
        };
        this.intervalId = setInterval(getDownloadProgress, 700);
        this.isBlast = true;
        this.showProgress = true;
        if (this.isCupheaPennycress(this.database)) {
          this.showPSIBlastResList = [];
          this.apiService.getPSIBlast('arabidopsis', this.sequence, "").subscribe(res => this.SplitPSIBlastRes(res));
          this.apiService.getPSIBlast('camelina', this.sequence, "").subscribe(res => this.SplitPSIBlastRes(res));
          this.apiService.getPSIBlast('soybean', this.sequence, "").subscribe(res => this.SplitPSIBlastRes(res));
          this.showProgress = false;
        }
        break;
      case 'pathway':
        this.pathwayList = [];
        this.noimg = false;
        this.pathwayLoading = true;
        this.apiService.getPathwaysByUniProt(this.speciesName, this.extendedData.uniprot_id).subscribe({
          next: (data: any) => {
            if (data && data.pathway_ids && data.pathway_ids.length > 0) {
              this.pathwayList = data.pathway_ids.map((id: string) => id.split(':')[1]);
              this.noimg = false;
            } else {
              this.noimg = true;
            }
            this.pathwayLoading = false;
          },
          error: () => {
            this.noimg = true;
            this.pathwayLoading = false;
          }
        });
        this.isPathway = true;
        break;
      default:
        break;
    }

    // update arrows
    switch (this.cfg) {
      case "summary":
        this.leftArrowEnabled = false;
        this.rightArrowEnabled = true;
        break;
      case "3DStructure":
      case "structure":
        this.leftArrowEnabled = true;
        this.rightArrowEnabled = true;
        break;
      case "blast":
        this.leftArrowEnabled = true;
        this.rightArrowEnabled = true;
        break;
      case "pathway":
        this.leftArrowEnabled = true;
        this.rightArrowEnabled = false;
        break;
      default:
        this.leftArrowEnabled = false;
        this.rightArrowEnabled = true;
        break;
    }
  }

  SplitRes(result: any) {
    let tmp = result.split('>');
    tmp.shift();
    if (!tmp[tmp.length - 1]) {
      this.dataService.BlastNeedUpdate = false;
      this.showBlastResList = [];
      return;
    }
    let index = tmp[tmp.length - 1].search('Lambda');
    tmp[tmp.length - 1] = tmp[tmp.length - 1].substring(0, index);

    this.showBlastResList = [];
    for (const entry of tmp) {
      const identities = this.extractPercentIdentities(entry);
      this.showBlastResList.push([entry.split(/\r?\n/)[0], entry, identities]);
    }
    this.showFilterBlastResList = this.showBlastResList;
    this.dataService.BlastNeedUpdate = false;
  }

  extractPercentIdentities(blastResult: string): string | null {
    const regex = /Identities = \d+\/\d+ \((\d+)%\)/g;
    let matches: RegExpExecArray | null = null;
    const lines = blastResult.split('\n');
    for (const line of lines) {
      matches = regex.exec(line);
      if (matches != null) break;
    }
    return matches == null ? null : matches[1];
  }

  SplitPSIBlastRes(result: any) {
    let tmp = result.split('>');
    tmp.shift();
    if (!tmp[tmp.length - 1]) {
      this.showPSIBlastResList = [];
      return;
    }
    let index = tmp[tmp.length - 1].search('Lambda');
    tmp[tmp.length - 1] = tmp[tmp.length - 1].substring(0, index);

    this.showPSIBlastResList = [];
    for (const entry of tmp) {
      const identities = this.extractPercentIdentities(entry);
      this.showPSIBlastResList.push([entry.split(/\r?\n/)[0], entry, identities]);
    }
    this.showFilterPSIBlastResList = this.showPSIBlastResList;
  }

  arrowSelect(
    arrow: string,
    summaryStep: MatStep,
    structure3DStep: MatStep,
    structureStep: MatStep,
    blastStep: MatStep,
    pathwayStep: MatStep
  ) {
    if (arrow === "left") {
      switch (this.cfg) {
        case "summary":
          break;
        case "3DStructure":
          structure3DStep.select();
          break;
        case "structure":
          summaryStep.select();
          break;
        case "blast":
          structureStep.select();
          break;
        case "pathway":
          blastStep.select();
          break;
      }
    } else {
      switch (this.cfg) {
        case "summary":
          structureStep.select();
          break;
        case "3DStructure":
          structure3DStep.select();
          break;
        case "structure":
          blastStep.select();
          break;
        case "blast":
          pathwayStep.select();
          break;
        case "pathway":
          break; // should not happen
      }
    }
  }

  selectImage(pathway: string) {
    this.isLoadingImage = true;
    this.selectedPathImage = `${environment.BASE_API_URL}highlighted_image/?species=${this.speciesName}&uniprot_id=${this.extendedData.uniprot_id}&pathway_id=${pathway}`;
  }

  onImageLoad() {
    this.isLoadingImage = false;
  }

  loadImage(pathway: string) {
    this.isLoadingImage = true;
    this.context = this.canvasEl.nativeElement.getContext('2d')!;
    const canvas = this.canvasEl.nativeElement;
    this.context.clearRect(0, 0, canvas.width, canvas.height);

    const elements: Array<{colour: string, width: number, height: number, top: number, left: number, url: string}> = [];

    this.http.get(environment.BASE_API_URL + 'getcoordinates/?pathway_id=' + pathway, { responseType: 'text' }).subscribe(data => {
      for (const line of data.substr(1).slice(0, -1).split('\\n')) {
        if (line.startsWith('rect')) {
          const linesplit = line.split('\\t');
          const pos = linesplit[0];
          const url = linesplit[1];
          const possplit = pos.split(' ');
          const topleft = possplit[1].slice(1, -1);
          const bottomright = possplit[2].slice(1, -1);
          const top = Number(topleft.split(',')[1]);
          const left = Number(topleft.split(',')[0]);
          const bottom = Number(bottomright.split(',')[1]);
          const right = Number(bottomright.split(',')[0]);

          elements.push({
            colour: '#FFFFFF',
            width: right - left,
            height: bottom - top,
            top: top,
            left: left,
            url: url
          });
        }
      }

      // 用箭头函数绑定事件，确保this指向组件实例
      canvas.addEventListener('click', (event: MouseEvent) => {
        const x = event.offsetX;
        const y = event.offsetY;

        elements.forEach(element => {
          if (y > element.top && y < element.top + element.height &&
              x > element.left && x < element.left + element.width) {
            window.open('http://www.kegg.jp' + element.url);
          }
        });
      });

      canvas.addEventListener('mousemove', (event: MouseEvent) => {
        const x = event.offsetX;
        const y = event.offsetY;
        let isIn = false;
        elements.forEach(element => {
          if (y > element.top && y < element.top + element.height &&
              x > element.left && x < element.left + element.width) {
            isIn = true;
            canvas.style.cursor = "pointer";
          }
        });
        if (!isIn) {
          canvas.style.cursor = "default";
        }
      });

      elements.forEach(element => {
        this.context.fillStyle = element.colour;
        this.context.fillRect(element.left, element.top, element.width, element.height);
      });

      const img1 = new Image();
      img1.onload = () => {
        this.isLoadingImage = false;
        this.context.canvas.height = img1.height;
        this.context.canvas.width = img1.width;
        this.context.drawImage(img1, 0, 0);
      };
      img1.src = `${environment.BASE_API_URL}highlighted_image/?species=${this.speciesName}&uniprot_id=${this.uniprot_id}&pathway_id=${pathway}`;
    });
  }

  showViewer(pdbId: string, pdbLinkBase: string) {
    this.dialog.open(StructureViewerComponent, {
      width: '1000px',
      height: '700px',
      data: { pdbId, pdbLinkBase }
    });
  }

  showTabForCupheaPennycress(isCupheaPennycress: boolean) {
    this.showAligmentsTab = !isCupheaPennycress;
    this.showStructrueTab = !isCupheaPennycress;
    this.showPathwayTab = !isCupheaPennycress;
    this.showSummaryTab = !isCupheaPennycress;
    this.showSimpleSummaryTab = isCupheaPennycress;
    this.showPsiBlastTab = isCupheaPennycress;
  }

  isCupheaPennycress(dataset: string) {
    return dataset === "Cuphea" || dataset === "Pennycress";
  }

  onBlastFilterValueChange(event: any) {
    const filterValue = parseFloat(event.value) || 0;
    this.showFilterBlastResList = this.showBlastResList.filter(item => item[2] > filterValue);
  }

  onPSIBlastFilterValueChange(event: any) {
    const filterValue = parseFloat(event.value) || 0;
    this.showFilterPSIBlastResList = this.showPSIBlastResList.filter(item => item[2] > filterValue);
  }
}
