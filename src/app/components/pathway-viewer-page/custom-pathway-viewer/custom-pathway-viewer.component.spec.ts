import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPathwayViewerComponent } from './custom-pathway-viewer.component';

describe('CustomPathwayViewerComponent', () => {
  let component: CustomPathwayViewerComponent;
  let fixture: ComponentFixture<CustomPathwayViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomPathwayViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomPathwayViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
