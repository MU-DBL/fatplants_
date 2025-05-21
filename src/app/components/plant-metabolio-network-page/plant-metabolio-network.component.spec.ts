import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantMetabolioNetworkComponent } from './plant-metabolio-network.component';

describe('PlantMetabolioNetworkComponent', () => {
  let component: PlantMetabolioNetworkComponent;
  let fixture: ComponentFixture<PlantMetabolioNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlantMetabolioNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantMetabolioNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
