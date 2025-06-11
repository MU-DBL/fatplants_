import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryofjohnComponent } from './memoryofjohn.component';

describe('MemoryofjohnComponent', () => {
  let component: MemoryofjohnComponent;
  let fixture: ComponentFixture<MemoryofjohnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemoryofjohnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemoryofjohnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
