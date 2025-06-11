import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { APIService } from '../../../services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loci-summary',
  templateUrl: './loci-summary.component.html',
  styleUrls: ['./loci-summary.component.scss'],
})
export class LociSummaryComponent implements OnInit {
  locationSummariesDataSource = new MatTableDataSource<any>(); // DataSource for the table
  searchQuery: string = ''; // Query for search

  @ViewChild(MatPaginator) paginator!: MatPaginator; // Paginator reference

  constructor(private apiService: APIService, private router: Router) {}

  ngOnInit(): void {
    this.loadLocationSummaries(); // Load data on component initialization

    // Custom filter predicate for Pathways and other columns
    this.locationSummariesDataSource.filterPredicate = (data, filter: string) => {
      const searchText = filter.trim().toLowerCase();
  
      // Ensure all fields are checked for null or undefined before calling toLowerCase()
      const locationMatch = (data.location_name?.toLowerCase().includes(searchText)) || false;
      
      // Check if abbreviations is an array or string and handle accordingly
      const abbreviationMatch = (Array.isArray(data.abbreviations) 
        ? data.abbreviations.join(' ').toLowerCase().includes(searchText) 
        : data.abbreviations?.toLowerCase().includes(searchText)) || false;
  
      // Ensure activities is an array and process accordingly
      const activitiesMatch = (Array.isArray(data.activities) 
        ? data.activities.some((activity: string) => activity?.toLowerCase().includes(searchText)) 
        : false);
  
      // Search in pathways array, ensuring pathway fields are strings
      const pathwaysMatch = (data.pathways?.some((pathway: any) =>
        pathway.nameabbreviation?.toLowerCase().includes(searchText))) || false;
  
      // Return true if any column matches the search text
      return locationMatch || abbreviationMatch || activitiesMatch || pathwaysMatch;
    };
  }

  // Method to load data from API
  loadLocationSummaries(): void {
    this.apiService.get_location_summary().subscribe(
      (data: any[]) => {
        this.locationSummariesDataSource.data = data;
        this.locationSummariesDataSource.paginator = this.paginator;
        console.log(this.locationSummariesDataSource.data);
      },
      (error) => {
        console.error('Error fetching location summaries:', error);
        this.locationSummariesDataSource.data = []; // Clear data on error
      }
    );
  }

  // Apply search filter to the data source
  applySearchQuery(): void {
    this.locationSummariesDataSource.filter = this.searchQuery.trim().toLowerCase();
  }

  // Handle input change to update search query
  onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
  }

  onLociClick(location_id: string, event: Event): void {
    event.preventDefault(); 
    this.apiService.get_enzyme_from_location_id(location_id).subscribe((data: any[]) => {
      this.router.navigate([`/enzymes/${data[0].enzyme_id}`]);
    }, error => {
      console.error('error: cant find enzyme for this location: ' + location_id);
    });
  }
}
