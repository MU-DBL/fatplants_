import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedPathwayViewerComponent } from './extended-pathway-viewer.component';

describe('ExtendedPathwayViewerComponent', () => {
  let component: ExtendedPathwayViewerComponent;
  let fixture: ComponentFixture<ExtendedPathwayViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtendedPathwayViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendedPathwayViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
