import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { APIService } from 'src/app/services/api/api.service';
import { ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CustomPathwayDialogComponent } from '../commons/custom-pathway-dialog/custom-pathway-dialog.component';

@Component({
  selector: 'app-custom-pathway',
  templateUrl: './custom-pathway.component.html',
  styleUrls: ['./custom-pathway.component.scss']
})
export class CustomPathwayComponent implements OnInit {

  constructor(
    private apiService: APIService,
    private activatedRoute: ActivatedRoute,
    private renderer: Renderer2,
    private dialog: MatDialog
  ) {}

  @ViewChild('canvas', { static: true }) 
  canvas!: ElementRef<HTMLCanvasElement>;

  ctx: CanvasRenderingContext2D | null = null;
  canvasListener: () => void = () => {};
  clickRects: {
    path: Path2D;
    picPath: Path2D;
    title: string;
    fpLink: string;
    uniProtLink: string;
    coords: { x: number, y: number, w: number, h: number };
  }[] = [];

  bm!: ImageBitmap;
  hoveredRects: typeof this.clickRects = [];

  showingUniprot = false;
  selectedGraph!: any[];
  graphTable: any[] = [];
  img: HTMLImageElement = new Image();

  displayedColumns = ["title", "uniProtLink", "geneName", "dataSet", "modified"];

  ngOnInit(): void {
    this.img = new Image();

    this.activatedRoute.queryParams.subscribe(params => {
      const graphId: string = params['id'];
      console.log("The params are:", params);

      this.apiService.getPathwayAreaById(graphId).subscribe((graph: any) => {
        if (!graph || typeof graph !== 'object') {
          return;
        }

        const graphArray = Array.isArray(graph) ? graph : Object.values(graph);
        this.selectedGraph = graphArray;
        console.log("Selected graph:", this.selectedGraph);

        const graphHash: Record<string, number> = {};
        this.graphTable = [];

        this.apiService.getPathwayImgById(graphId).subscribe((data: any) => {
          if (Array.isArray(data) && data.length > 0 && data[0].img_path) {
            this.img.src = data[0].img_path;
          }
        });

        this.selectedGraph.forEach((graphEntry: any) => {
          if (!graphHash[graphEntry.title]) {
            graphHash[graphEntry.title] = 1;
            const linkSeg = graphEntry.fp_link?.split('/') ?? [];
            if (linkSeg[linkSeg.length - 1] !== 'undefined') {
              this.graphTable.push({
                title: graphEntry.title,
                fpLink: graphEntry.fp_link,
                uniProtLink: graphEntry.uniprot_link
              });
            }
          }
        });

        this.img.onload = () => this.drawMap();

        this.apiService.getGeneInfoByProtId(this.graphTable).subscribe((vals: any[]) => {
          vals.forEach((doc: any, index: number) => {
            const d = doc.docs?.[0]?.data?.();
            this.graphTable[index].geneName = d?.gene_name ?? 'N/A';
            this.graphTable[index].dataSet = d?.dataset ?? 'N/A';
            this.graphTable[index].modified = d?.modified ?? 'N/A';
          });
        });
      });
    });
  }

  drawMap() {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    if (!this.ctx) return;
    this.clickRects = [];

    createImageBitmap(this.img, 0, 0, this.img.width, this.img.height).then(bm => {
      this.bm = bm;
      this.ctx!.drawImage(this.bm, 0, 0);

      this.selectedGraph?.forEach(graphEntry => {
        const points = graphEntry.coords.split(',');
        if (points.length === 4) {
          const rectWidth = points[2];
          const rectHeight = points[3];
          const adjRectWidth = (rectWidth / this.img.width) * this.canvas.nativeElement.scrollWidth;
          const adjRectHeight = (rectHeight / this.img.height) * this.canvas.nativeElement.scrollHeight;
          const pointX = (points[0] / this.img.width) * this.canvas.nativeElement.scrollWidth;
          const pointY = (points[1] / this.img.height) * this.canvas.nativeElement.scrollHeight;

          const newPath = new Path2D();
          const newPicPath = new Path2D();

          newPicPath.rect(points[0], points[1], rectWidth, rectHeight);
          newPath.rect(pointX, pointY, adjRectWidth, adjRectHeight);

          this.clickRects.push({
            path: newPath,
            picPath: newPicPath,
            title: graphEntry.title,
            fpLink: graphEntry.fp_link,
            uniProtLink: graphEntry.uniprot_link,
            coords: {
              x: points[0],
              y: points[1],
              w: rectWidth,
              h: rectHeight
            }
          });
        }
      });

      this.canvasListener = this.renderer.listen(this.canvas.nativeElement, 'mousemove', (e) => {
        this.hoveredRects = [];
        this.ctx!.drawImage(this.bm, 0, 0);
        this.ctx!.beginPath();

        this.clickRects.forEach((rect) => {
          if (this.ctx!.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
            this.hoveredRects.push(rect);
          }
        });

        this.hoveredRects.forEach(rect => {
          this.ctx!.fillStyle = "rgba(219,112,147,0.3)";
          this.ctx!.fill(rect.picPath);
        });
      });

      this.canvasListener = this.renderer.listen(this.canvas.nativeElement, 'click', (e) => {
        let hasOpenedDialog = false;

        this.clickRects.forEach(rect => {
          if (this.ctx!.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
            if (this.hoveredRects.length === 1) {
              if (this.showingUniprot)
                window.open(rect.uniProtLink, '_blank');
              else
                window.open(rect.fpLink, '_blank');
            } else if (this.hoveredRects.length !== 0 && !hasOpenedDialog) {
              hasOpenedDialog = true;
              this.openDialog();
            }
          }
        });
      });
    });
  }

  drawMapForTitle(title: string) {
    if (!this.ctx) return;
    this.ctx.drawImage(this.bm, 0, 0);

    this.clickRects.forEach(rect => {
      if (rect.title === title) {
        this.ctx!.beginPath();
        this.ctx!.fillStyle = "rgba(219,112,147,0.3)";
        this.ctx!.fill(rect.picPath);
      }
    });
  }

  clearMap() {
    if (this.ctx) {
      this.ctx.drawImage(this.bm, 0, 0);
    }
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      hoveredRects: this.hoveredRects
    };
    this.dialog.open(CustomPathwayDialogComponent, dialogConfig);
  }

  openLink(rect: any) {
    window.open(rect.uniProtLink, '_blank');
  }
}