import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyPanelOfButtonsComponent } from './my-panel-of-buttons.component';

describe('MyPanelOfButtonsComponent', () => {
  let component: MyPanelOfButtonsComponent;
  let fixture: ComponentFixture<MyPanelOfButtonsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MyPanelOfButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPanelOfButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
