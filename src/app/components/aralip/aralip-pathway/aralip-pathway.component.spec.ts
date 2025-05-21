import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AralipPathwayComponent } from './aralip-pathway.component';

describe('AralipPathwayComponent', () => {
  let component: AralipPathwayComponent;
  let fixture: ComponentFixture<AralipPathwayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AralipPathwayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AralipPathwayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
