import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2 } from "@angular/core";

import { EventHandler } from "../../interfaces/event-handler.interface";
import { EventService } from "../../services/event.service";

// CREDIT: strongly inspired by mat-video: https://github.com/nkoehler/mat-video
@Component({
  selector: "my-video-play-button",
  templateUrl: "./my-video-play-button.component.html",
  styleUrls: ["./my-video-play-button.component.scss"]
})

export class MyVideoPlayButtonComponent implements AfterViewInit, OnDestroy {
  @Input() video: HTMLVideoElement;

  @Input() play = false;

  @Output() playChanged = new EventEmitter<boolean>();
  // Feb. 2023 note: End of media is no longer event driven, given instability seen with early 2023 browser updates.
  // Rather, it will be noted based on video time approaching/passing the duration.  Code commented out rather than
  // deleted to note where we were on this issue (of chaining video stories when end was reached on prior to then load up the next).
  // @Output() EndOfMediaIssued = new EventEmitter<boolean>();

  @Input() keyboard = true;

  private events: EventHandler[];

  constructor(private renderer: Renderer2, private evt: EventService) {}

  ngAfterViewInit(): void {
    this.events = [
      { element: this.video, name: "play", callback: event => this.setVideoPlayback(true), dispose: null },
      { element: this.video, name: "pause", callback: event => this.setVideoPlayback(false), dispose: null },
      // no longer used: { element: this.video, name: "durationchange", callback: event => this.setVideoPlayback(false), dispose: null },
      // no longer used: { element: this.video, name: "ended", callback: event => this.setVideoPlayback(false), dispose: null },
      { element: this.video, name: "click", callback: event => this.toggleVideoPlayback(), dispose: null }
    ];

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
    this.play ? this.video.play() : this.video.pause();
    this.playChanged.emit(this.play);
  }

  @HostListener("document:keyup.space", ["$event"])
  onPlayKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.toggleVideoPlayback();
      event.preventDefault();
    }
  }
}
