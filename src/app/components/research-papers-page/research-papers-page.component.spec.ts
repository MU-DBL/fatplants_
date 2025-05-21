import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchPapersPageComponent } from './research-papers-page.component';

describe('ResearchPapersPageComponent', () => {
  let component: ResearchPapersPageComponent;
  let fixture: ComponentFixture<ResearchPapersPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchPapersPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchPapersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
