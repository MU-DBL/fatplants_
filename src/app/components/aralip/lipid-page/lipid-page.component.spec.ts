import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LipidPageComponent } from './lipid-page.component';

describe('LipidPageComponent', () => {
  let component: LipidPageComponent;
  let fixture: ComponentFixture<LipidPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LipidPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LipidPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
