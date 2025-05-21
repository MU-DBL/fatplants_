import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute} from '@angular/router';
import { APIService } from '../../../services/api/api.service';

@Component({
  selector: 'app-hehos',
  templateUrl: './hehos.component.html',
  styleUrls: ['./hehos.component.scss']
})
export class HehosComponent implements OnInit {
  locusDataSource!: MatTableDataSource<any>;
  
  id="2"
  name="";
  reactions: any[] = [];
  pathways: any[] = [];
  locus: any[] = [];
  ref_selected=null;
  mutant_selected: any = null;
  est_selected=false;

  constructor(private route: ActivatedRoute, private apiService: APIService) { 
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
      if(!this.id){
        this.id="1"
      }else if(parseInt(this.id)<1 || parseInt(this.id)>270){
        this.id="1"
      }
    });
  }

  ngOnInit(): void {
    this.apiService.getHehoName(this.id).subscribe((data: any[]) => {
      this.name=data[0].name;//TO DO:if data is empty?
    }, error => {
    });

    this.apiService.getHehoReaction(this.id).subscribe((data: any[]) => {
      this.reactions=data;
    }, error => {
    });

    this.apiService.getHehoPathway(this.id).subscribe((data: any[]) => {
      this.pathways=data;
    }, error => {
    });

    this.apiService.getHehoLocus(this.id).subscribe((data: any[]) => {
      this.locus=data;
      this.locusDataSource = new MatTableDataSource(data);
    }, error => {
    });
  }

  closeRefPopup() {
    this.ref_selected=null;
  }

  closeMutantPopup() {
    this.mutant_selected=null;
  }

  closeEstPopup() {
    this.est_selected=false;
  }

  showRef(data: any): void{
    this.mutant_selected=null;
    this.ref_selected=data;
    this.est_selected=false;
  }

  showMutant(data: any): void{
    this.mutant_selected=data;
    this.ref_selected=null;
    this.est_selected=false;
  }

  showEst(): void{
    this.mutant_selected=null;
    this.ref_selected=null;
    this.est_selected=true;
  }

  convertToHtml(input: String): String {
    let htmlString = input.replace(/~(.*?)~/g, '<sub>$1</sub>');
    htmlString = htmlString.replace(/\^(.*?)\^/g, '<sup>$1</sup>');
    return htmlString;
  }
}
