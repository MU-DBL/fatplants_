import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathwayNetworkLlmComponent } from './pathway-network-llm.component';

describe('PathwayNetworkLlmComponent', () => {
  let component: PathwayNetworkLlmComponent;
  let fixture: ComponentFixture<PathwayNetworkLlmComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PathwayNetworkLlmComponent]
    });
    fixture = TestBed.createComponent(PathwayNetworkLlmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
