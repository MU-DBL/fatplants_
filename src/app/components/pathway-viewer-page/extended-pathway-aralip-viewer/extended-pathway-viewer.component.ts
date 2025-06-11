import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';
import { mappingData } from './mapping';

interface GraphBox {
  label: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}

interface ClickRect {
  path: Path2D;
  picPath: Path2D;
  label: string;
  coords: {
    x: number;
    y: number;
    w: number;
    h: number;
  }
}

@Pipe ({
  name : 'excludeListItem'
})
export class ExcludeListItemPipe implements PipeTransform {
  transform(items: any[], exclusion: any): any {
    if (!items) {
      return items;
    }
    return items.filter(item => item != exclusion);
  }
}

@Component({
  selector: 'app-extended-pathway-viewer',
  templateUrl: './extended-pathway-viewer.component.html',
  styleUrls: ['./extended-pathway-viewer.component.scss']
})

export class ExtendedPathwayViewerComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  ctx!: CanvasRenderingContext2D;
  canvasListener: any;
  clickRects: any;
  bm!: ImageBitmap;
  hoveredRects: ClickRect[] = [];
  img!: HTMLImageElement;
  selectedGraph: GraphBox[] = [];
  selectedOption: any;
  loading = true;
  selectedTair = "";
  selectedProtein: any;

  displayedColumns: string[] = ['In_Fatplants', 'Protein_Name', 'TAIR_ID', 'UniProt_ID'];

  columnTitles = {
    Protein_Name: 'Protein Name',
    TAIR_ID: 'TAIR ID',
    UniProt_ID: 'UniProt ID'
  }

  pathwayOptions = [
    {
      link: "/app/assets/pathwayImages/Cutin Synthesis & Transport 1.png",
      data: "/app/assets/pathwayImages/Cutin Synthesis & Transport 1.json",
      name: "Cutin Synthesis & Transport 1"
    },
    {
      link: "/app/assets/pathwayImages/Phospholipid Signaling.png",
      data: "/app/assets/pathwayImages/Phospholipid Signaling.json",
      name: "Phospholipid Signaling"
    },
    {
      link: "/app/assets/pathwayImages/Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 1.png",
      data: "/app/assets/pathwayImages/Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 1.json",
      name: "Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 1"
    },
    {
      link: "/app/assets/pathwayImages/Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 2.png",
      data: "/app/assets/pathwayImages/Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 2.json",
      name: "Prokaryotic Galactolipid, Sulfolipid, & Phospholipid Synthesis 2"
    },
    {
      link: "/app/assets/pathwayImages/Triacylglycerol & Fatty Acid Degradation.png",
      data: "/app/assets/pathwayImages/Triacylglycerol & Fatty Acid Degradation.json",
      name: "Triacylglycerol & Fatty Acid Degradation"
    },
    {
      link: "/app/assets/pathwayImages/Eukaryotic Galactolipid & Sulfolipid Synthesis.png",
      name: "Eukaryotic Galactolipid & Sulfolipid Synthesis"
    },
    {
      link: "/app/assets/pathwayImages/Fatty Acid Elongation, Desaturation & Export From Plastid.png",
      name: "Fatty Acid Elongation, Desaturation & Export From Plastid"
    },
    {
      link: "/app/assets/pathwayImages/Fatty Acid Synthesis.png",
      name: "Fatty Acid Synthesis"
    },
    {
      link: "/app/assets/pathwayImages/Oxylipin Metabolism 1.png",
      name: "Oxylipin Metabolism 1"
    },
    {
      link: "/app/assets/pathwayImages/Oxylipin Metabolism 2.png",
      name: "Oxylipin Metabolism 2"
    },
  ];

  constructor(private httpClient: HttpClient, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.selectedOption = this.pathwayOptions[0];
    this.img = new Image();
    this.img.src = this.selectedOption.link;
    this.img.onload = () => this.loadCoordinates();
    this.setupMousemove();
    this.setupClickEvent();
  }

  // 当下拉菜单选项变化时调用
  onChange(newOption) {
    this.selectedProtein = [];
    this.loading = true;
    this.selectedOption = newOption;
    this.img = new Image();
    this.img.src = this.selectedOption.link;
    this.img.onload = () => this.loadCoordinates();
    this.setupMousemove();
    this.setupClickEvent();
  }

  navigateToProtein(element: any) {
    if (element)
      window.open('/protein/' + element.UniProt_ID, '_blank');
  }

  loadCoordinates() {
    this.loading = false;
    this.selectedGraph = [];
    if (this.selectedOption.data) {
      this.httpClient.get(this.selectedOption.data).subscribe((data: any) => {
        let baseGraph = data.shapes;
        baseGraph.forEach(box => {
          let posX = box.points[0][0];
          let posY = box.points[0][1];
          let width = box.points[1][0] - posX;
          let height = box.points[1][1] - posY;

          this.selectedGraph.push({
            label: box.label,
            posX: posX,
            posY: posY,
            width: width,
            height: height
          });
        });
        this.drawMap();
      });
    } else {
      this.drawMap();
    }
  }

  drawMap() {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.clickRects = [];

    createImageBitmap(this.img, 0, 0, this.img.width, this.img.height).then(bm => {
      this.bm = bm;
      this.ctx.drawImage(this.bm, 0, 0);

      this.selectedGraph.forEach(box => {
        let adjRectWidth = (box.width / this.img.width) * this.canvas.nativeElement.scrollWidth;
        let adjRectHeight = (box.height / this.img.height) * this.canvas.nativeElement.scrollHeight;

        let pointX = (box.posX / this.img.width) * this.canvas.nativeElement.scrollWidth;
        let pointY = (box.posY / this.img.height) * this.canvas.nativeElement.scrollHeight;

        let newPath = new Path2D();
        let newPicPath = new Path2D();

        newPicPath.rect(box.posX, box.posY, box.width, box.height);
        newPath.rect(pointX, pointY, adjRectWidth, adjRectHeight);

        this.clickRects.push({
          path: newPath,
          picPath: newPicPath,
          label: box.label,
          coords: {
            x: box.posX,
            y: box.posY,
            w: box.width,
            h: box.height
          }
        });
      });
    });
    this.setupMousemove();
    this.setupClickEvent();
  }

  setupMousemove() {
    this.renderer.listen(this.canvas.nativeElement, 'mousemove', (e) => {
      this.hoveredRects = [];

      this.ctx.drawImage(this.bm, 0, 0);

      this.ctx.beginPath();
      this.clickRects.forEach(rect => {
        if (this.ctx.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
          this.hoveredRects.push(rect);
        }
      });

      this.hoveredRects.forEach(rect => {
        this.ctx.fillStyle = "rgba(219,112,147,0.3)";
        this.ctx.fill(rect.picPath);
      });
    });
  }

  setupClickEvent() {
    this.canvasListener = this.renderer.listen(this.canvas.nativeElement, 'click', (e) => {
      this.clickRects.forEach(rect => {
        if (this.ctx.isPointInPath(rect.path, e.offsetX, e.offsetY)) {
          if (this.hoveredRects.length == 1) {
            let clicked_protein = this.hoveredRects[0].label;
            this.selectedProtein = mappingData.filter(item => item["Protein_Name"] === clicked_protein);
            this.selectedTair = rect.label;
          }
        }
      });
    });
  }
}
