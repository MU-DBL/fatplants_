import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlmolStructurePageComponent } from './glmol-structure-page.component';

describe('GlmolStructurePageComponent', () => {
  let component: GlmolStructurePageComponent;
  let fixture: ComponentFixture<GlmolStructurePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GlmolStructurePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlmolStructurePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
