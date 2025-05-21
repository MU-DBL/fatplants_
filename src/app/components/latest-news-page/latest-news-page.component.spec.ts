import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestNewsPageComponent } from './latest-news-page.component';

describe('LatestNewsPageComponent', () => {
  let component: LatestNewsPageComponent;
  let fixture: ComponentFixture<LatestNewsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LatestNewsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestNewsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
