import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { APIService } from 'src/app/services/api/api.service';


interface GraphItem {
  title: string;
  paper: string;
  link: string;
  id: string;
  imgPath: string;
}

@Component({
  selector: 'app-custom-pathway-viewer',
  templateUrl: './custom-pathway-viewer.component.html',
  styleUrls: ['./custom-pathway-viewer.component.scss']
})

export class CustomPathwayViewerComponent implements OnInit {
  
  constructor(private apiService: APIService,
    private formBuilder: FormBuilder) { }

  panelOpenState = false;
  dataSource: GraphItem[] = [];
  loading = true;
  displayedColumns = ["title", "paper", "link"];
  error: string = "";

  addPathwayForm!: FormGroup;
  imgFile;
  coordFile;

  user: any = null;

  deleteButton(pathwayId, imgSrc) {
    this.loading = true;
  }

  onImageFileChange(event) {
    if (event.target.files.length > 0)
      this.imgFile = event.target.files[0];
  }

  onCoordFileChange(event) {
    if (event.target.files.length > 0)
      this.coordFile = event.target.files[0];
  }

  ngOnInit(): void {

    // construct form validation
    this.addPathwayForm = this.formBuilder.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      paper: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      coordsFile: [null, [
        Validators.required
      ]],
      imgFile: [null, [
        Validators.required
      ]]
    });

   //code below will get datas from sql instead of firestore
      this.apiService.getAllPathways().subscribe((pathways:any[]) => {
        this.dataSource = [];
        //Object.keys(pathways).forEach(graph => {
        pathways.forEach(graph => {
          //let graphAny: any = graph.payload.doc.data();
  
          this.dataSource.push({
            title: graph.title,
            paper: graph.paper,
            link: '/custom-pathway?id=' + graph.pathway_id,
            id: graph.pathway_id,
            imgPath: graph.imgPath
          });
  
          this.loading = false;
        });
      });
  }
}
