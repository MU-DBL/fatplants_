import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-pathway-viewer-page',
  templateUrl: './pathway-viewer-page.component.html',
  styleUrls: ['./pathway-viewer-page.component.scss']
})
export class PathwayViewerPageComponent implements OnInit {

  constructor() { }

   tabs = [
    { label: 'Tab 1' },
    { label: 'Tab 2' },
    { label: 'Tab 3' },
  ];
  selectedTab = this.tabs[0];

  ngOnInit(): void {
  }

}
