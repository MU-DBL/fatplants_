import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinCamelinaComponent } from './protein-camelina.component';

describe('ProteinCamelinaComponent', () => {
  let component: ProteinCamelinaComponent;
  let fixture: ComponentFixture<ProteinCamelinaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteinCamelinaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinCamelinaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
