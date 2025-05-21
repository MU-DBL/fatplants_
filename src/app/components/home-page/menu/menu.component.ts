import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  public isSidebarVisible: boolean = false;
  public showHamburgerIcon: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  public toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    this.showHamburgerIcon = !this.isSidebarVisible;
  }
  public closeSidebar(): void {
    this.isSidebarVisible = false;
    this.showHamburgerIcon = true;
  }
}
