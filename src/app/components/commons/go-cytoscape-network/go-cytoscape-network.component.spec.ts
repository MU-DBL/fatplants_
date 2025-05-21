import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoCytoscapeNetworkPageComponent } from './go-cytoscape-network.component';

describe('GoCytoscapeNetworkPageComponent', () => {
  let component: GoCytoscapeNetworkPageComponent;
  let fixture: ComponentFixture<GoCytoscapeNetworkPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoCytoscapeNetworkPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoCytoscapeNetworkPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
