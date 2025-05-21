import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPathwayDialogComponent } from './custom-pathway-dialog.component';

describe('CustomPathwayDialogComponent', () => {
  let component: CustomPathwayDialogComponent;
  let fixture: ComponentFixture<CustomPathwayDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomPathwayDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomPathwayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
