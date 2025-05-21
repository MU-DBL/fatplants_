import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlastPageComponent } from './blast-page.component';

describe('BlastPageComponent', () => {
  let component: BlastPageComponent;
  let fixture: ComponentFixture<BlastPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlastPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlastPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
