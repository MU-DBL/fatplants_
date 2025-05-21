import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinDetailsPageComponent } from './protein-details-page.component';

describe('ProteinDetailsNewComponent', () => {
  let component: ProteinDetailsPageComponent;
  let fixture: ComponentFixture<ProteinDetailsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProteinDetailsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
