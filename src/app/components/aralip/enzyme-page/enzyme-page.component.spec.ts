import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnzymePageComponent } from './enzyme-page.component';

describe('EnzymePageComponent', () => {
  let component: EnzymePageComponent;
  let fixture: ComponentFixture<EnzymePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnzymePageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnzymePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
