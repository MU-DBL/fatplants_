import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitDashboardComponent } from './visit-dashboard.component';

describe('VisitDashboardComponent', () => {
  let component: VisitDashboardComponent;
  let fixture: ComponentFixture<VisitDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisitDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
