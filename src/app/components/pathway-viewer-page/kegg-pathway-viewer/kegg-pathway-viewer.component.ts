import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { APIService } from 'src/app/services/api/api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-kegg-pathway-viewer',
  templateUrl: './kegg-pathway-viewer.component.html',
  styleUrls: ['./kegg-pathway-viewer.component.scss']
})
export class KeggPathwayViewerComponent implements OnInit {

  @ViewChild('canvasEl', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;
  context!: CanvasRenderingContext2D;

  kegg2pathway: { [key: string]: any } = {};
  currPath: string ="";

  noimg = true;
  isLoadingImage = false;
  imgs: SafeResourceUrl[] = [];
  uniprot = '';
  loading = false;
  selectedImage: string | null = null;
  pathwayList: string[] = [];

  species = [
    { name: "Arabidopsis", value: "lmpd" },
    { name: "Camelina", value: "camelina" },
    { name: "Soybean", value: "soya" }
  ];

  selectedSpecies = this.species[0].value;
  query = "";
  relatedGeneNames: any[] = [];
  selectedFPID = "";
  displayedGeneColumns = ["uniprot_id", "geneName", "proteinNames"];
  noRes = true;
  hasSearched = false;

  private elements: Array<{
    colour: string,
    width: number,
    height: number,
    top: number,
    left: number,
    url: string
  }> = [];

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    private db: APIService
  ) {}

  ngOnInit() {
    this.context = this.canvasEl.nativeElement.getContext('2d')!;
  }

  getPathways() {
    this.pathwayList = [];
    this.loading = true;
    this.selectedImage = null;

    this.db.getPathwaysByUniProt(this.selectedSpecies, this.uniprot).subscribe({
      next: (data: any) => {
        if (data && data.pathway_ids && data.pathway_ids.length > 0) {
          this.pathwayList = data.pathway_ids.map((id: string) => id.split(':')[1]);
          this.noimg = false;
        } else {
          this.noimg = true;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.noimg = true;
      }
    });
  }

  onSearchSubmit() {
    this.selectedImage = null;
    this.hasSearched = true;
    this.noimg = false;
    this.noRes = false;
    this.relatedGeneNames = [];
    this.pathwayList = [];
    this.loading = true;
    this.clearCanvas();

    this.db.searchSQLAPI(this.query, this.selectedSpecies).subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          this.relatedGeneNames = data.length > 1 ? data.slice(0, 10) : [];
          this.uniprot = data[0].uniprot_id;
          this.selectedFPID = data[0].fp_id;
          this.getPathways();
        } else {
          this.noRes = true;
          this.loading = false;
        }
      },
      error: () => {
        this.noRes = true;
        this.loading = false;
      }
    });
  }

  changeSpecies(e: any) {
    this.selectedSpecies = e.value;
  }

  selectColumn(uniprot_id: string, fp_id: string) {
    this.uniprot = uniprot_id;
    this.selectedFPID = fp_id;
    this.clearCanvas();
    this.getPathways();
  }

  setDefaultSearch() {
    this.query = "A8MR93";
  }

  selectImage(pathway: string) {
    this.isLoadingImage = true;
    this.loadImage(pathway);
  }

  

  loadImage(pathway: string) {
    this.isLoadingImage = true;
    const id = pathway;
    this.selectedImage = environment.BASE_API_URL + "highlighted_image/?species=" + this.selectedSpecies + "&uniprot_id=" + this.uniprot + "&pathway_id=" + pathway;

    this.clearCanvas();

    this.elements = [];

    this.http.get(environment.BASE_API_URL + 'getcoordinates/?pathway_id=' + id, { responseType: 'text' }).subscribe({
      next: (data) => {
        for (const line of data.substr(1).slice(0, -1).split('\\n')) {
          if (line.startsWith('rect')) {
            const linesplit = line.split('\\t');
            const pos = linesplit[0];
            const url = linesplit[1];
            const possplit = pos.split(' ');
            let topleft = possplit[1];
            let bottomright = possplit[2];
            topleft = topleft.slice(1, -1);
            bottomright = bottomright.slice(1, -1);

            var top = Number(topleft.split(',')[1]);
            var left = Number(topleft.split(',')[0]);
            var bottom = Number(bottomright.split(',')[1]);
            var right = Number(bottomright.split(',')[0]);

            this.elements.push({
              colour: '#FFFFFF',
              width: right - left,
              height: bottom - top,
              top: top,
              left: left,
              url: url
            });
          }
        }

        // 事件监听用箭头函数，避免this指向问题
        const canvas = this.canvasEl.nativeElement;

        canvas.onclick = (event: MouseEvent) => {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          this.elements.forEach(element => {
            if (y > element.top && y < element.top + element.height
              && x > element.left && x < element.left + element.width) {
              window.open('http://www.kegg.jp' + element.url);
            }
          });
        };

        canvas.onmousemove = (event: MouseEvent) => {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          let isIn = false;
          this.elements.forEach(element => {
            if (y > element.top && y < element.top + element.height
              && x > element.left && x < element.left + element.width) {
              isIn = true;
              canvas.style.cursor = "pointer";
            }
          });
          if (!isIn) {
            canvas.style.cursor = "default";
          }
        };

        const ctx = this.context;
        this.elements.forEach(element => {
          ctx.fillStyle = element.colour;
          ctx.fillRect(element.left, element.top, element.width, element.height);
        });

        const img1 = new Image();
        img1.onload = () => {
          this.isLoadingImage = false;
          ctx.canvas.height = img1.height;
          ctx.canvas.width = img1.width;
          ctx.drawImage(img1, 0, 0);
        };
        img1.src = this.selectedImage!;
      },
      error: () => {
        this.isLoadingImage = false;
      }
    });
  }

  clearCanvas() {
    if (!this.context) {
      this.context = this.canvasEl.nativeElement.getContext('2d')!;
    }
    const canvas = this.canvasEl.nativeElement;
    this.context.clearRect(0, 0, canvas.width, canvas.height);
  }
}
