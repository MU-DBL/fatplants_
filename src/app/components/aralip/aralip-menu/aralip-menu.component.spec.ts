import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AralipMenuComponent } from './aralip-menu.component';

describe('AralipMenuComponent', () => {
  let component: AralipMenuComponent;
  let fixture: ComponentFixture<AralipMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AralipMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AralipMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
