import { Component, EventEmitter, HostListener, Input, Output, input } from "@angular/core";


// CREDIT: strongly inspired by mat-video: https://github.com/nkoehler/mat-video
@Component({
    selector: "my-video-cc-button",
    templateUrl: "./my-video-cc-button.component.html",
    styleUrls: ["./my-video-cc-button.component.scss"],
    imports: []
})

export class MyVideoClosedCaptionButtonComponent {
  readonly video = input<HTMLVideoElement>(undefined);

  // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
  //  Your application code writes to the input. This prevents migration.
  @Input() CCshown = false;

  @Output() CCDisplayChanged = new EventEmitter<boolean>();

  constructor() {}

  toggleCCDisplay(): void {
    this.CCshown = !this.CCshown;
    // FYI: take action on this.video based on new value for CCshown...
    this.CCDisplayChanged.emit(this.CCshown);
  }
}
