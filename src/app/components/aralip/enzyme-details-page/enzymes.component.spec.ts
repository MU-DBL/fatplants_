import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymesComponent } from './enzymes.component';

describe('EnzymesComponent', () => {
  let component: EnzymesComponent;
  let fixture: ComponentFixture<EnzymesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnzymesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnzymesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
