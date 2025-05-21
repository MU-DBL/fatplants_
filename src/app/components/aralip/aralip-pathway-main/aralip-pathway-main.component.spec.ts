import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AralipPathwayMainComponent } from './aralip-pathway-main.component';

describe('AralipPathwayMainComponent', () => {
  let component: AralipPathwayMainComponent;
  let fixture: ComponentFixture<AralipPathwayMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AralipPathwayMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AralipPathwayMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
