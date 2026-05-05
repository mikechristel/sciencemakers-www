import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2, inject, input } from "@angular/core";

import { EventHandler } from "../../interfaces/event-handler.interface";
import { EventService } from "../../services/event.service";


// CREDIT: strongly inspired by mat-video: https://github.com/nkoehler/mat-video
@Component({
    selector: "my-video-play-button",
    templateUrl: "./my-video-play-button.component.html",
    styleUrls: ["./my-video-play-button.component.scss"],
    imports: []
})

export class MyVideoPlayButtonComponent implements AfterViewInit, OnDestroy {
  private renderer = inject(Renderer2);
  private evt = inject(EventService);

  readonly video = input<HTMLVideoElement>();

  // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
  //  Your application code writes to the input. This prevents migration.
  @Input() play = false;

  @Output() playChanged = new EventEmitter<boolean>();
  // Feb. 2023 note: End of media is no longer event driven, given instability seen with early 2023 browser updates.
  // Rather, it will be noted based on video time approaching/passing the duration.  Code commented out rather than
  // deleted to note where we were on this issue (of chaining video stories when end was reached on prior to then load up the next).
  // @Output() EndOfMediaIssued = new EventEmitter<boolean>();

  readonly keyboard = input(true);

  private events!: EventHandler[]; // set up in ngAfterViewInit

  ngAfterViewInit(): void {
    this.events = [
      { element: this.video(), name: "play", callback: () => this.setVideoPlayback(true), dispose: null },
      { element: this.video(), name: "pause", callback: () => this.setVideoPlayback(false), dispose: null },
      { element: this.video(), name: "click", callback: () => this.toggleVideoPlayback(), dispose: null }
    ];
    // NOTE: no longer used: { element: this.video, name: "durationchange", callback: event => this.noteDurationChange(), dispose: null },
    // no longer used: { element: this.video, name: "ended", callback: event => this.noteEndOfMediaReached(), dispose: null },

    this.evt.addEvents(this.renderer, this.events);
  }

  ngOnDestroy(): void {
    this.evt.removeEvents(this.events);
  }

  /* No longer used: noteDurationChange() {
      // Unclear why durationchange would fire, and having it is causing unusual behavior.  This was its action:
      this.setVideoPlayback(false);
  }

  No longer used: noteEndOfMediaReached() {
    this.play = false;
    this.playChanged.emit(false); // play state is false upon reaching the end of the media; note this for listeners (e.g., state of play/pause button)
    this.EndOfMediaIssued.emit(); // listeners may take special action on end of media
  } */

  setVideoPlayback(value: boolean) {
    if (this.play !== value) {
      this.toggleVideoPlayback();
    }
  }

  toggleVideoPlayback(): void {
    this.play = !this.play;
    this.updateVideoPlayback();
  }

  updateVideoPlayback(): void {
    const videoElement = this.video();
    if (videoElement != null) {
      if (this.play)
        videoElement.play();
      else
        videoElement.pause();
      this.playChanged.emit(this.play);
    }
  }

  @HostListener("document:keyup.space", ["$event"])
  onPlayKey(event: KeyboardEvent) {
    if (this.keyboard()) {
      this.toggleVideoPlayback();
      event.preventDefault();
    }
  }
}
