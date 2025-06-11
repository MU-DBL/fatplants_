import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { APIService } from '../../../services/api/api.service';

@Component({
  selector: 'app-enzymes',
  templateUrl: './enzymes.component.html',
  styleUrls: ['./enzymes.component.scss']
})
export class EnzymesComponent implements OnInit {
  locusDataSource!: MatTableDataSource<any>;

  id = "2";
  name = "";
  reactions: any[] = [];
  pathways: any[] = [];
  locus: any[] = [];

  ref_selected: any = null;
  mutant_selected: any = null;
  est_selected = false;
  isPopupOpen = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private route: ActivatedRoute, private apiService: APIService) {
    this.route.paramMap.subscribe(params => {
      const paramId = params.get('id');
      if (!paramId || parseInt(paramId) < 1 || parseInt(paramId) > 270) {
        this.id = "1";
      } else {
        this.id = paramId;
      }
    });
  }

  ngOnInit(): void {
    this.apiService.getEnzymeName(this.id).subscribe((data: any[]) => {
      if(data && data.length > 0){
        this.name = data[0].name;
      } else {
        this.name = '';
      }
    });

    this.apiService.getEnzymeReaction(this.id).subscribe((data: any[]) => {
      this.reactions = data || [];
      if (this.id === "1" || this.id === "270") {
        this.reactions.sort((a, b) => b.domain.localeCompare(a.domain));
      } else {
        this.reactions.sort((a, b) => a.reactiontype.localeCompare(b.reactiontype));
      }
    });

    this.apiService.getEnzymePathway(this.id).subscribe((data: any[]) => {
      this.pathways = data || [];
    });

    this.apiService.getEnzymeLocus(this.id).subscribe((data: any[]) => {
      this.locus = data || [];
      if (this.locus.length === 0) {
        this.locusDataSource = new MatTableDataSource<any>([]);
      } else {
        this.locusDataSource = new MatTableDataSource(this.locus);
        // 如果你需要分页器，请确保在模板中声明并在 AfterViewInit 绑定
        setTimeout(() => {
          if(this.paginator){
            this.locusDataSource!.paginator = this.paginator;
          }
        });
      }
    }, error => {
      this.locusDataSource = new MatTableDataSource<any>([]);
    });
  }

  closeRefPopup() {
    this.ref_selected = null;
  }

  closeMutantPopup() {
    this.mutant_selected = null;
  }

  closeEstPopup() {
    this.est_selected = false;
  }

  showRef(data: any): void {
    this.mutant_selected = null;
    this.ref_selected = data;
    this.est_selected = false;
  }

  showMutant(data: any): void {
    this.mutant_selected = data;
    this.ref_selected = null;
    this.est_selected = false;
  }

  showEst(): void {
    this.mutant_selected = null;
    this.ref_selected = null;
    this.est_selected = true;
  }

  convertToHtml(input: string): string {
    let htmlString = input.replace(/~(.*?)~/g, '<sub>$1</sub>');
    htmlString = htmlString.replace(/\^(.*?)\^/g, '<sup>$1</sup>');
    return htmlString;
  }
}
