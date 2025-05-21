import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HehosComponent } from './hehos.component';

describe('HehosComponent', () => {
  let component: HehosComponent;
  let fixture: ComponentFixture<HehosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HehosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HehosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
