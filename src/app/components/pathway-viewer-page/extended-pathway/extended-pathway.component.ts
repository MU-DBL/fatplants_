import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { tairDict, objList } from './existing_tairs';
import { Pipe, PipeTransform } from '@angular/core';

interface Detail {
  tair_id: string;
  protein: string;
  rna_seq: string;
  trap_seq: string;
  prot_log2FC: string;
  prot_qvalue: string;
  prot_pvalue: string;
  trans_log2FC: string;
  trans_qvalue: string;
  log2_transcriptomeChanges: string;
  log2_translatomeChanges: string;
  log2_TE: string;
  Zscore_Log2_TE: string;
  description: string;
}

@Pipe({ name: 'excludeListItem' })
export class ExcludeListItemPipe implements PipeTransform {
  transform(items: any[], exclusion: any): any {
    return items?.filter(item => item !== exclusion);
  }
}

@Component({
  selector: 'app-extended-pathway',
  templateUrl: './extended-pathway.component.html',
  styleUrls: ['./extended-pathway.component.scss']
})
export class ExtendedPathwayComponent implements OnInit {
  constructor(private httpClient: HttpClient, private renderer: Renderer2) { }

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  ctx!: CanvasRenderingContext2D | null;
  bm!: ImageBitmap;
  img!: HTMLImageElement;

  canvasListener: (() => void) | null = null;
  clickRects: any[] = [];
  hoveredRects: any[] = [];
  selectedGraph: any[] = [];
  selectedOption: any;
  selectedUniprot: string = "";
  selectedTair: string = "";
  loading = true;

  selectedDetails: Detail[] = [{
    tair_id: "",
    protein: "",
    rna_seq: "",
    trap_seq: "",
    prot_log2FC: "",
    prot_qvalue: "",
    prot_pvalue: "",
    trans_log2FC: "",
    trans_qvalue: "",
    log2_transcriptomeChanges: "",
    log2_translatomeChanges: "",
    log2_TE: "",
    Zscore_Log2_TE: "",
    description: ""
  }];

  columnSections = [
    ["in_fp", "protein", "rna_seq", "trap_seq"],
    ["in_fp", "prot_log2FC", "prot_qvalue", "prot_pvalue"],
    ["in_fp", "trans_log2FC", "trans_qvalue"],
    ["in_fp", "log2_transcriptomeChanges", "log2_translatomeChanges", "log2_TE", "Zscore_Log2_TE"]
  ];

  columnTitles: Record<string, string> = {
    protein: "Protein",
    rna_seq: "RNA-Seq",
    trap_seq: "Trap-Seq",
    prot_log2FC: "Log2FC",
    prot_qvalue: "q Value",
    prot_pvalue: "p Value",
    trans_log2FC: "Log2FC",
    trans_qvalue: "q Value",
    log2_transcriptomeChanges: "log2_transcriptomeChanges",
    log2_translatomeChanges: "log2_translatomeChanges",
    log2_TE: "log2_TE",
    Zscore_Log2_TE: "Zscore_Log2_TE"
  };

  displayedColumns = this.columnSections[0];

  pathwayOptions = [
    {
      link: "/app/assets/pathwayImages/extendedImages/pathway1.png",
      data: "/app/assets/pathwayImages/extendedImages/pathway1.json",
      name: "Image 1"
    },
    {
      link: "/app/assets/pathwayImages/extendedImages/pathway2.png",
      data: "/app/assets/pathwayImages/extendedImages/pathway2.json",
      name: "Image 2"
    },
    {
      link: "/app/assets/pathwayImages/extendedImages/pathway3.png",
      data: "/app/assets/pathwayImages/extendedImages/pathway3.json",
      name: "Image 3"
    },
    {
      link: "/app/assets/pathwayImages/extendedImages/pathway4.png",
      data: "/app/assets/pathwayImages/extendedImages/pathway4.json",
      name: "Image 4"
    }
  ];

  ngOnInit(): void {
    this.selectedOption = this.pathwayOptions[0];
    this.loadImageAndCoordinates();
  }

  changeTable(event: { index: number }): void {
    this.displayedColumns = this.columnSections[event.index];
  }

  onChange(newOption: any): void {
    this.loading = true;
    this.selectedOption = newOption;
    this.loadImageAndCoordinates();
  }

  loadImageAndCoordinates(): void {
    this.img = new Image();
    this.img.src = this.selectedOption.link;
    this.img.onload = () => this.loadCoordinates();
  }

  loadCoordinates(): void {
    this.loading = false;
    this.httpClient.get<any>(this.selectedOption.data).subscribe(data => {
      const baseGraph = data.shapes;
      this.selectedGraph = baseGraph.map((box: any) => {
        const posX = box.points[0][0];
        const posY = box.points[0][1];
        const width = box.points[1][0] - posX;
        const height = box.points[1][1] - posY;
        return { label: box.label, posX, posY, width, height };
      });
      this.drawMap();
    });
  }

  navigateToProtein(): void {
    if (this.selectedUniprot) {
      window.open('/protein/' + this.selectedUniprot, '_blank');
    }
  }

  drawMap(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.clickRects = [];

    createImageBitmap(this.img).then(bm => {
      this.bm = bm;
      this.ctx?.drawImage(this.bm, 0, 0);

      this.selectedGraph.forEach(box => {
        const canvasWidth = this.canvas.nativeElement.scrollWidth;
        const canvasHeight = this.canvas.nativeElement.scrollHeight;

        const adjRectWidth = (box.width / this.img.width) * canvasWidth;
        const adjRectHeight = (box.height / this.img.height) * canvasHeight;
        const pointX = (box.posX / this.img.width) * canvasWidth;
        const pointY = (box.posY / this.img.height) * canvasHeight;

        const newPath = new Path2D();
        const newPicPath = new Path2D();

        newPicPath.rect(box.posX, box.posY, box.width, box.height);
        newPath.rect(pointX, pointY, adjRectWidth, adjRectHeight);

        this.clickRects.push({
          path: newPath,
          picPath: newPicPath,
          label: box.label,
          coords: { x: box.posX, y: box.posY, w: box.width, h: box.height }
        });
      });

      // Hover behavior
      if (this.canvasListener) this.canvasListener(); // remove previous listener

      this.canvasListener = this.renderer.listen(this.canvas.nativeElement, 'mousemove', (e: MouseEvent) => {
        this.hoveredRects = [];
        this.ctx?.drawImage(this.bm, 0, 0);
        this.ctx?.beginPath();

        this.clickRects.forEach(rect => {
          if (this.ctx?.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
            this.hoveredRects.push(rect);
          }
        });

        this.hoveredRects.forEach(rect => {
          if (this.ctx) {
            this.ctx.fillStyle = "rgba(219,112,147,0.3)";
            this.ctx.fill(rect.picPath);
          }
        });
      });

      // Click behavior
      this.canvasListener = this.renderer.listen(this.canvas.nativeElement, 'click', (e: MouseEvent) => {
        this.clickRects.forEach(rect => {
          if (this.ctx?.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
            if (this.hoveredRects.length === 1) {
              const detail = objList.find(o => o.tair_id === rect.label);
              this.selectedDetails = [detail ?? this.selectedDetails[0]];
              this.selectedUniprot = tairDict[rect.label] ?? "";
              this.selectedTair = rect.label;
            }
          }
        });
      });
    });
  }
}
