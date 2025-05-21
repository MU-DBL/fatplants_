import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinDetailComponent } from './protein-detail.component';

describe('ProteinDetailComponent', () => {
  let component: ProteinDetailComponent;
  let fixture: ComponentFixture<ProteinDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteinDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
