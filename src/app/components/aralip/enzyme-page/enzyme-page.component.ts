import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { APIService } from '../../../services/api/api.service';

@Component({
  selector: 'app-enzyme-page',
  templateUrl: './enzyme-page.component.html',
  styleUrls: ['./enzyme-page.component.scss']
})
export class EnzymePageComponent implements OnInit, AfterViewInit {

  showingSearch = false;
  searchQuery = "";

  arabidopsisDataSource!: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private route: ActivatedRoute, private apiService: APIService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['searchTerm'] || "";
      this.applySearchQuery();
    });
  }

  ngAfterViewInit() {
    if (this.arabidopsisDataSource) {
      this.arabidopsisDataSource.paginator = this.paginator;
    }
  }

  onSearchChange(query) {
    this.searchQuery = query.target.value;
  } 
  
  applySearchQuery() {
    this.showingSearch = true;
    this.apiService.searchEnzyme(encodeURIComponent(this.searchQuery)).subscribe(
      (data: any[]) => {
        this.arabidopsisDataSource = new MatTableDataSource(data);
        if (this.paginator) {
          this.arabidopsisDataSource.paginator = this.paginator;
        }
      },
      error => {
        this.arabidopsisDataSource = new MatTableDataSource<any>([]);
      }
    );
  }
}
