import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinSoybeanComponent } from './protein-soybean.component';

describe('ProteinSoybeanComponent', () => {
  let component: ProteinSoybeanComponent;
  let fixture: ComponentFixture<ProteinSoybeanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteinSoybeanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinSoybeanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
