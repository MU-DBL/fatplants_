import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GptDialogComponent } from './gpt-dialog.component';

describe('GptDialogComponent', () => {
  let component: GptDialogComponent;
  let fixture: ComponentFixture<GptDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GptDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
