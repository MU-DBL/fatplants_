import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendedPathwayComponent } from './extended-pathway.component';

describe('ExtendedPathwayComponent', () => {
  let component: ExtendedPathwayComponent;
  let fixture: ComponentFixture<ExtendedPathwayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtendedPathwayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtendedPathwayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
