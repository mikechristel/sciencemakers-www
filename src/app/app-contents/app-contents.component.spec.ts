import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppContentsComponent } from './app-contents.component';

describe('AppContentsComponent', () => {
  let component: AppContentsComponent;
  let fixture: ComponentFixture<AppContentsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [AppContentsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppContentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
