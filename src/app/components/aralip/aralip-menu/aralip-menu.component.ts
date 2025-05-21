import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService } from '../../../services/api/api.service';

@Component({
  selector: 'app-aralip-menu',
  templateUrl: './aralip-menu.component.html',
  styleUrls: ['./aralip-menu.component.scss']
})
export class AralipMenuComponent implements OnInit {
  
  page !: string;
  pathway_id !: string;

  allowedPathwayIds = [
    "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", 
    "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"
  ];

  pathways = [
    { id: "2", name: "Fatty Acid Synth" },
    { id: "3", name: "Plast FAE & Desat" },
    { id: "4", name: "Prok Gal/Sulpho I" },
    { id: "5", name: "Prok Gal/Sulpho II" },
    { id: "6", name: "Prok Gal/Sulpho II" },
    { id: "7", name: "TAG Synthesis" },
    { id: "8", name: "Euk Phospholipid" },
    { id: "9", name: "TAG Degradation" },
    { id: "10", name: "FA Elong & Wax" },
    { id: "11", name: "Sphingolipid I" },
    { id: "12", name: "Sphingolipid II" },
    { id: "13", name: "Mito FAS & Lipoic" },
    { id: "14", name: "Mito Phospholipid" },
    { id: "15", name: "Mito LipoPolySach" },
    { id: "16", name: "Trafficking" },
    { id: "17", name: "Cutin I" },
    { id: "18", name: "Cutin II" },
    { id: "19", name: "Suberin I" },
    { id: "20", name: "Suberin II" },
    { id: "21", name: "Suberin III" },
    { id: "22", name: "Oxylipin I" },
    { id: "23", name: "Oxylipin II" },
    { id: "24", name: "Signaling" }
  ];

  constructor(private route: ActivatedRoute, private router: Router, private apiService: APIService) {
    this.route.paramMap.subscribe(params => {
      // console.log(params)
      this.page = params.get('page')!;
      if(this.page == 'pathway')
        this.pathway_id = params.get('pathway_id')!;
      else
        this.pathway_id = ""
    });
  }

  ngOnInit(): void {
  }

  changePage(newPage: any) {
    const numericPage = Number(newPage);
    if (Number.isInteger(numericPage)) {
      // console.log(newPage)
      this.router.navigate(["aralip-menu/pathway/" + newPage]);
    } else {
      this.router.navigate(["aralip-menu/" + newPage]);
    }
  }
}
