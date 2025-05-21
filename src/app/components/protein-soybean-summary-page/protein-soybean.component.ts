import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FunctionEntry } from 'src/app/interfaces/FunctionEntry';
import { MatTableDataSource } from '@angular/material/table';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { GptDialogComponent } from 'src/app/components/commons/gpt-dialog/gpt-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { APIService } from '../../services/api/api.service';

@Component({
  selector: 'app-protein-soybean',
  templateUrl: './protein-soybean.component.html',
  styleUrls: ['./protein-soybean.component.scss']
})
export class ProteinSoybeanComponent implements OnInit {

  constructor(
    private route: ActivatedRoute, 
    public notificationService: NotificationService,
    public dialog: MatDialog, 
    private apiService: APIService
  ) {}

  translationObject: any;
  uniprotId: string = '';
  arapidopsisData: any;
  proteinData: any;
  proteinEntry: any;
  functions: FunctionEntry[] = [];
  isLoadingArapidopsis = true;
  proteinDataSource: MatTableDataSource<FunctionEntry> = new MatTableDataSource();
  isLoadingProtein = true;

  selectedGPTQuery = '';
  splitGeneNames: string[] = [];

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

  // Switched from Firestore to MySQL
  getUniprotData() {
    this.apiService.getDetailByUniprotid("soya", encodeURIComponent(this.uniprotId)).subscribe({
      next: (res: any[]) => {
        this.arapidopsisData = res[0];
        if (this.arapidopsisData !== undefined && this.arapidopsisData.gene_names) {
          this.arapidopsisData.gene_names = this.arapidopsisData.gene_names.replaceAll(' ', ', ');

          this.apiService.searchSpeciesMapper("glymine_max", encodeURIComponent(this.arapidopsisData.uniprot_id)).subscribe({
            next: (translation: any) => {
              this.translationObject = translation;
              this.proteinData = this.arapidopsisData;

              const geneNames: string = this.proteinData.gene_names ?? '';
              this.splitGeneNames = geneNames.split(',').map((g: string) => g.trim()).filter(g => g);
              this.selectedGPTQuery = this.splitGeneNames.length > 0 ? this.splitGeneNames[0] : '';

              this.isLoadingProtein = false;
              this.proteinEntry = this.arapidopsisData.protein_entry;
              this.proteinDataSource = new MatTableDataSource<FunctionEntry>(this.arapidopsisData.features ?? []);
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
    return originalKeywords.split(';').map(k => k.trim()).filter(k => k).join(', ');
  }

  getAlternativeNames(altNames: string[]): string {
    if (!Array.isArray(altNames)) return '';
    return altNames.join(', ');
  }

  selectGPTOption(selection: any) {
    this.selectedGPTQuery = selection.value;
  }
}
