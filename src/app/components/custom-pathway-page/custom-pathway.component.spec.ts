import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPathwayComponent } from './custom-pathway.component';

describe('CustomPathwayComponent', () => {
  let component: CustomPathwayComponent;
  let fixture: ComponentFixture<CustomPathwayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomPathwayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomPathwayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
