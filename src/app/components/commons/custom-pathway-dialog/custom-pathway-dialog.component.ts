import { Inject } from '@angular/core'; 
import { Component, OnInit } from '@angular/core'; 
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// 把接口放在这里，组件装饰器之前
interface CustomDialogData {
  hoveredRects: any[];  // 推荐根据实际结构替换 any
}

@Component({
  selector: 'app-custom-pathway-dialog',
  templateUrl: './custom-pathway-dialog.component.html',
  styleUrls: ['./custom-pathway-dialog.component.scss']
})
export class CustomPathwayDialogComponent implements OnInit {

  hoveredRects: any[];

  constructor(
    private dialogRef: MatDialogRef<CustomPathwayDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomDialogData
  ) {
    this.hoveredRects = data.hoveredRects;
  }

  ngOnInit(): void {
    // 可选初始化逻辑
  }

  close(): void {
    this.dialogRef.close();
  }
}
