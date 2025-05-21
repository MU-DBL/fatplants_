import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PathwayViewerPageComponent } from './pathway-viewer-page.component';

describe('PathwayViewerPageComponent', () => {
  let component: PathwayViewerPageComponent;
  let fixture: ComponentFixture<PathwayViewerPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PathwayViewerPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PathwayViewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
