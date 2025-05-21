import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  advancedSearchForm!: FormGroup;
  searchForm!: FormGroup;
  showAdvancedSearch = false; // 用于控制模态框

  constructor(private router: Router, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.searchForm = this.formBuilder.group({
      species: ["arabidopsis", Validators.required],
      searchTerm: ["", Validators.required],
    });
    this.advancedSearchForm = this.formBuilder.group({
      species: ["arabidopsis", Validators.required],
      uniprotId: [""],
      tairId: [""],
    });
  }

  submitSearch() {
    const species = this.searchForm.get("species")!.value;
    const searchTerm = this.searchForm.get("searchTerm")!.value;

    this.router.navigate(["/datasets/" + species], {
      queryParams: { searchTerm: searchTerm },
    });
  }

  openPopup() {
    this.advancedSearchForm.reset();
    this.advancedSearchForm.get("species")!.setValue("arabidopsis");
    this.showAdvancedSearch = true;
  }

  closePopup() {
    this.showAdvancedSearch = false;
  }

  submitAdvancedSearch() {
    if (this.advancedSearchForm.valid) {
      const species = this.advancedSearchForm.get("species")!.value;
      const uniprotId = this.advancedSearchForm.get("uniprotId")!.value;
      const tairId = this.advancedSearchForm.get("tairId")!.value;

      this.closePopup();
      this.router.navigate(["/datasets/" + species], {
        queryParams: { uniprotId, tairId },
      });
    }
  }
}
