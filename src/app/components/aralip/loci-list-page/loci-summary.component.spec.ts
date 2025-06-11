import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LociSummaryComponent } from './loci-summary.component';

describe('LociSummaryComponent', () => {
  let component: LociSummaryComponent;
  let fixture: ComponentFixture<LociSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LociSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LociSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
