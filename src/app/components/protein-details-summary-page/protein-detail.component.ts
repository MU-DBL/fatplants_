import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FunctionEntry } from 'src/app/interfaces/FunctionEntry';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { GptDialogComponent } from 'src/app/components/commons/gpt-dialog/gpt-dialog.component';
import { APIService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-protein-detail',
  templateUrl: './protein-detail.component.html',
  styleUrls: ['./protein-detail.component.scss']
})
export class ProteinDetailComponent implements OnInit {

  translationObject: any = null;
  uniprotId: string = '';
  arapidopsisData: any = null;
  proteinData: any = null;
  proteinEntry: any = null;
  functions: FunctionEntry[] = [];
  isLoadingArapidopsis: boolean = true;
  proteinDataSource: MatTableDataSource<FunctionEntry> = new MatTableDataSource<FunctionEntry>();
  isLoadingProtein: boolean = true;
  displayedColumns: string[] = [
    'type',
    'start',
    'end',
    'length',
    'description'
  ];

  selectedGPTQuery: string = "";
  splitGeneNames: string[] = [];

  constructor(
    private route: ActivatedRoute,
    public notificationService: NotificationService,
    public dialog: MatDialog,
    private db: APIService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.uniprotId = params['uniprot_id'] ?? '';
      this.getUniprotData();
    });
  }

  openGptDialog() {
    this.dialog.open(GptDialogComponent, {
      data: { identifier: this.selectedGPTQuery }
    });
  }

  getUniprotData() {
    this.db.getDetailByUniprotid("lmpd", encodeURIComponent(this.uniprotId)).subscribe({
      next: (res: any[]) => {
        this.arapidopsisData = res?.[0] ?? null;
        if (this.arapidopsisData) {
          this.arapidopsisData.protein_name = this.arapidopsisData.protein_names ?? '';
          this.arapidopsisData.gene_names = (this.arapidopsisData.gene_names ?? '').replaceAll(' ', ', ');
          this.proteinEntry = this.arapidopsisData.protein_entry ?? null;
          this.proteinDataSource = new MatTableDataSource<FunctionEntry>(this.arapidopsisData.features ?? []);

          this.db.searchSpeciesMapper("arabidopsis", encodeURIComponent(this.arapidopsisData.uniprot_id)).subscribe({
            next: (translation: any) => {
              this.translationObject = translation;
              this.proteinData = this.arapidopsisData;

              const geneNamesString = this.proteinData.gene_names ?? '';
              this.splitGeneNames = geneNamesString.split(',').map((s: string) => s.trim()).filter((s: string | any[]) => s.length > 0);
              this.selectedGPTQuery = this.splitGeneNames[0] ?? '';
              this.isLoadingProtein = false;
            },
            error: () => {
              this.isLoadingProtein = false;
            }
          });
        } else {
          this.isLoadingProtein = false;
        }
        this.isLoadingArapidopsis = false;
      },
      error: () => {
        this.isLoadingProtein = false;
        this.isLoadingArapidopsis = false;
      }
    });
  }

  parseKeywords(originalKeywords: string): string {
    if (!originalKeywords) return '';
    return originalKeywords.split(';').map(k => k.trim()).filter(k => k.length > 0).join(', ');
  }

  getAlternativeNames(altNames: string[]): string {
    if (!Array.isArray(altNames)) return '';
    return altNames.join(', ');
  }

  selectGPTOption(selection: any) {
    this.selectedGPTQuery = selection.value;
  }

}
