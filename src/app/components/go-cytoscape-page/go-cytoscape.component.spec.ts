import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoCytoscapeComponent } from './go-cytoscape.component';

describe('GoCytoscapeComponent', () => {
  let component: GoCytoscapeComponent;
  let fixture: ComponentFixture<GoCytoscapeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoCytoscapeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoCytoscapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
