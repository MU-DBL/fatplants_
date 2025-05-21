import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KeggPathwayViewerComponent } from './kegg-pathway-viewer.component';

describe('KeggPathwayViewerComponent', () => {
  let component: KeggPathwayViewerComponent;
  let fixture: ComponentFixture<KeggPathwayViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeggPathwayViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeggPathwayViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
