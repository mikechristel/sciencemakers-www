// CREDIT: greatly inspired by mat-video (https://github.com/nkoehler/mat-video) with subset of that functionality here;
// see https://github.com/nkoehler/mat-video/blob/master/projects/mat-video/src/lib/video.component.ts 
//
// Feb. 2022 NOTE: The repo was abandoned in July 2020 and will not work in Angular 13.  Sadly, as browsers update, it may fail since recent 2022 Firefox versions (e.g., 97) also showed video player issues (no CC text).
// So, this component may need to either be replaced (but will accessibility and CC support still be there as expected?!?!), or overhauled with a re-inspection of the latest
// documentation on HTML5 video player support.
//
// Update based on https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL (it does NOT support MediaStream), and advice noted in
// https://stackoverflow.com/questions/49886248/how-to-replace-url-createobjecturl that:
//   Note: The use of a MediaStream object (not to be confused with MediaSource) as an input to this method is in the process of being deprecated.
//   Discussions are ongoing about whether or not it should be removed outright. As such, you should try to avoid using this method with MediaStreams,
//   and should use HTMLMediaElement.srcObject instead.
// As a result, MediaStream is removed as a Interface option on the Input src variable, and argument Interface option for setVideoSrc function.  MediaSource remains viable.

// Dec. 2023 update: let the parent component know the first time a video play initiates, i.e., the first time "playing" updates within this component from false to true.
// This is done for COUNTER logging of events: that first "play" action is something to be logged.
//
// April 2026 update: with Angular 21 and zoneless/signals, this line formerly in the component html was problematic:
// <p class="playtime">{{ video?.currentTime | secondsToTime }} / {{ video?.duration | secondsToTime }}</p> (with secondsToTime a pipe to convert string number to years:months:days:hh:mm:ss)
// Instead, now doing (with simplification in moving from secondsToTime pipe (code formerly in ./seconds-to-time.pipe) to secondsToTimeString() local procedure which only does hh:mm:ss):
// protected videoLoaded = signal(false); // formerly, this was a boolean, now a signal
// protected currentTimeForUI = signal('0:00');
// protected currentDurationForUI = signal('0:00');
// <p class="playtime">{{ currentTimeForUI() + ' / ' + currentDurationForUI() }}</p>
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges, ViewChild, OnInit, inject, input, signal } from "@angular/core";

import { EventHandler } from "./interfaces/event-handler.interface";
import { EventService } from "./services/event.service";

import { UserSettingsManagerService } from '../../user-settings/user-settings-manager.service';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to closed captioning, as asked for by accessibility experts
import { GlobalState }          from '../../app.global-state';

import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { NgClass } from "@angular/common";
import { MyVideoPlayButtonComponent } from "./ui/my-video-play-button/my-video-play-button.component";
import { MyVideoRewindButtonComponent } from "./ui/my-video-rewind-button/my-video-rewind-button.component";
import { MyVideoFastForwardButtonComponent } from "./ui/my-video-ffwd-button/my-video-ffwd-button.component";
import { MyVideoClosedCaptionButtonComponent } from "./ui/my-video-cc-button/my-video-cc-button.component";
import { MyVideoSpinnerComponent } from "./ui/my-video-spinner/my-video-spinner.component";

@Component({
    selector: 'my-video',
    templateUrl: './my-video.component.html',
    styleUrls: ['./my-video.component.scss'],
    imports: [NgClass, MyVideoPlayButtonComponent, MyVideoRewindButtonComponent, MyVideoFastForwardButtonComponent, MyVideoClosedCaptionButtonComponent, MyVideoSpinnerComponent]
})

export class MyVideoComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private _renderer = inject(Renderer2);
  private evt = inject(EventService);
  private globalState = inject(GlobalState);
  private liveAnnouncer = inject(LiveAnnouncer);
  private userSettingsManagerService = inject(UserSettingsManagerService);

  @ViewChild('thmplayer', { static: false }) player: ElementRef;
  @ViewChild('video', { static: false }) video: ElementRef;

  // communicates transcript time and end of video to parent component
  @Output() timeChange: EventEmitter<number> = new EventEmitter();
  @Output() mediaEndIssued: EventEmitter<any> = new EventEmitter();

  readonly src = input<string | MediaSource | Blob>(null);
  // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() urlToCCIndicator: string = null;
  // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() poster: string = null;
  readonly initialSeek = input<number>(0); // if greater than zero, seek to this as currentTime (seconds) when first loaded

  readonly keyboard = input(true);
  readonly muted = input(false);
  @Output() mutedChange = new EventEmitter<boolean>();

  // communicate the first time "playing" is set to true, much like mediaEndIssued communicates when media end is reached
  @Output() playStartedFirstTime: EventEmitter<any> = new EventEmitter();
  firstPlayInitiated:boolean = false;

  private readonly OFFSET_FOR_FFWD_AND_REWIND:number = 5; // move in increments of 5% for rewind and fast-forward
  private readonly MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING:number = 99; // do not allow user-positioning into beyond 99% of the media
                                                                        // (so that auto-chaining of stories not accidentally/confusingly triggered by the user)
  // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  get time() {
      var val: number = 0;
      const videoPerhaps: HTMLVideoElement | null = this.getVideoTag();
      if (videoPerhaps)
          val = videoPerhaps.currentTime;
      return val;
  }

  set time(val: number) {
      if (val == null)
          return; // give up early on null or undefined input

      const MEANINGFUL_TIME_DELTA = 0.0001; // ignore any jitters at values at or under this threshold
      const videoPerhaps: HTMLVideoElement | null = this.getVideoTag();
      var endOfMediaReached: boolean = false;
      var actualCurTimePercent: number;

      if (videoPerhaps) {
          const video: HTMLVideoElement = videoPerhaps;
          const videoLength = video.duration;
          if (val >= videoLength - MEANINGFUL_TIME_DELTA) {
              val = videoLength;
              endOfMediaReached = true;
          }
          if (val < 0) {
              val = 0;
          }
          if (endOfMediaReached || Math.abs(val - video.currentTime) > MEANINGFUL_TIME_DELTA) {
              video.currentTime = val;
          }
          if (endOfMediaReached || Math.abs(this.lastTime - video.currentTime) > MEANINGFUL_TIME_DELTA) {
              setTimeout(() => this.timeChange.emit(video.currentTime), 0);
              this.lastTime = video.currentTime;
          }
          if (!this.isPercentInFlux && videoLength > 0) {
              // since curTimePercent not updated in evTimeUpdate, always do so here UNLESS user is manipulating the slider,
              // signaled with isPercentInFlux; note that curTimePercent is rounded to the nearest integer for better accessibility
              // as this value is read for screen reader users.
              if (endOfMediaReached)
                  actualCurTimePercent = 100;
              else
                  actualCurTimePercent = Math.round((val * 100) / videoLength);
              // NOTE: keep this.curTimePercent in range [0, 99] which is [0, this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING]
              if (actualCurTimePercent <= this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING)
                  this.curTimePercent = actualCurTimePercent;
              else
                  this.curTimePercent = this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING;
          }
          if (endOfMediaReached)
              this.actOnEndOfMedia();
      }
  }

  playing = false;

  videoWidth: number;
  videoHeight: number;
  lastTime: number = -1;
  curTimePercent: number = 0;
  isPercentInFlux: boolean = false;

  protected videoLoaded = signal(false); // NOTE: with zoneless and signals in Angular 21, now have this as a signal to trigger proper UI updating
  protected currentTimeForUI = signal('0:00');
  protected currentDurationForUI = signal('0:00');

  activeCCPiece: string = ""; // used to support Braille readers wanting control over active closed caption

  private srcObjectURL: string;

  // NOTE: With migration to Angular 17, NodeJS.Timer was causing "cannot find namespace issues" which led to a Google search that
  // brought in AI advice to use RxJS delay operator instead. That is done here.
  private isMouseMoving = false;
  // private isMouseMovingTimer: NodeJS.Timer; (retired in late 2024 with Angular 17 migration)
  private isMouseMovingTimeout = 2000;
  // NOTE:  with Angular 21 now need to use signals to trigger when mouse UI should be shown or not (starting with mouse to be shown)
  showMouseInUI = signal(true);

  private events: EventHandler[];

  // NOTE: There are many cautions against using autoplay, e.g., https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/autoplay --
  // leave it up to the user to turn it on if he/she so desires.
  defaultAutoPlay: boolean;

  currentCCDisplayState: boolean;

  ngOnInit(): void {
    this.defaultAutoPlay = this.userSettingsManagerService.currentAutoplay();
    this.currentCCDisplayState = this.userSettingsManagerService.currentCCText();
  }

  ngAfterViewInit(): void {
    this.events = [
      {
        element: this.video.nativeElement,
        name: "loadstart",
        callback: event => this.evLoadStatusChange(true),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "loadedmetadata",
        callback: event => this.evLoadedMetadata(event),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "error",
        callback: event => console.error("Unhandled Video Error", event),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "contextmenu",
        callback: event => event.preventDefault(),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "timeupdate",
        callback: event => this.evTimeUpdate(event),
        dispose: null
      },
      {
        element: this.player.nativeElement,
        name: "mousemove",
        callback: event => this.evMouseMove(event),
        dispose: null
      }
    ];

    this.video.nativeElement.onloadeddata = () => this.evLoadStatusChange(true);

    this.evt.addEvents(this._renderer, this.events);

    this.setVideoSrc(this.src());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src) {
      this.setVideoSrc(this.src());
    }
  }

  ngOnDestroy(): void {
    this.video.nativeElement.onloadeddata = null;

    this.evt.removeEvents(this.events);
  }

  load(): void {
    if (this.video && this.video.nativeElement) {
      this.video.nativeElement.load();
    }
  }

  getVideoTag(): HTMLVideoElement | null {
    return this.video && this.video.nativeElement ? (this.video.nativeElement as HTMLVideoElement) : null;
  }

  evLoadStatusChange(isLoaded: boolean): void {
    this.videoLoaded.set(isLoaded);
    this.activeCCPiece = "";
    // Update duration based on the load:
    if (isLoaded)
    {
        var durationAsString = '0:00';
        const videoPerhaps: HTMLVideoElement | null = this.getVideoTag();
        if (videoPerhaps)
            durationAsString = this.secondsToTimeString(videoPerhaps.duration);
        this.currentDurationForUI.set(durationAsString);
    }
  }

  evLoadedMetadata(event: any): void {
    this.videoWidth = this.video.nativeElement.videoWidth;
    this.videoHeight = this.video.nativeElement.videoHeight;
    this.evLoadStatusChange(true);
    if (this.initialSeek() > 0)
      this.time = this.initialSeek();
  }

  // NOTE: with Angular 21 zoneless no longer triggering UI updates, we will have "expression changed after it was checked" errors in that the UI will not update as it used to with zone.js and Angular 19.
  // So, need to use signals along with this.isMouseMoving logic and retire getOverlayClass, i.e., [ngClass]="getOverlayClass('show-mouse', 'hide-mouse')" in component becomes
  // [ngClass]="UIOverlayClassForMouse() with showMouseInUI a boolean signal to trigger the class to be either 'show-mouse' or 'hide-mouse' via [class]="showMouseInUI() ? 'show-mouse' : 'hide-mouse'"
  // 
  evMouseMove(event: any): void {
    if (!this.isMouseMoving)
    {
      this.isMouseMoving = true;
      this.showMouseInUI.set(true); // always is equal to !this.playing || this.isMouseMoving
      of(null).pipe(delay(this.isMouseMovingTimeout)).subscribe(() => {
        // Code to be executed after this.isMouseMovingTimeout milliseconds
        this.isMouseMoving = false;
         this.showMouseInUI.set(!this.playing); // always is equal to !this.playing || this.isMouseMoving which is !this.playing since this.isMouseMoving == false at this point
      });
    }
  }

  evTimeUpdate(event: any): void {
      const videoPerhaps: HTMLVideoElement | null = this.getVideoTag();
      if (videoPerhaps) {
          this.time = videoPerhaps.currentTime;

          // Perhaps signal for the current time (which collapses down to seconds duration as in mm:ss string format) might update.
          this.CheckNeedToUpdateUICurrentTime(); // will use this.time as set one line before....
      }
  }

  protected CheckNeedToUpdateUICurrentTime(): void {
      // NOTE: formerly component did: <p class="playtime">{{ video?.currentTime | secondsToTime }} / {{ video?.duration | secondsToTime }}</p>
      // Now, component does <p class="playtime">{{ currentTimeForUI() + ' / ' + currentDurationForUI() }}</p>
      // Retired former pipe secondsToTime 
      var newCurrentTimeString = this.secondsToTimeString(this.time);
      var currentTimeString = this.currentTimeForUI();
      if (newCurrentTimeString !== currentTimeString)
          this.currentTimeForUI.set(newCurrentTimeString);
  }

  protected secondsToTimeString(givenSeconds: number): string {
      // Originally greatly inspired by mat-video project, which provided a richer pipe; see https://github.com/nkoehler/mat-video
      // Simplified here to not also have year or month or day as a timesBoundary (year: 31557600, month: 2629746, day: 86400 - just hour.
      // !!! So, will report video time greater than 23 hours and 59 minutes and 59 seconds in a strange way - update as needed to bring back days/months/years!
      var timesBoundaries = {
        
        hour: 3600
      };

      if (!givenSeconds) {
          return "0:00";
      } else {
          let timeString = "";
          // Get hours as h: or hh: or even hhhh: (see note above about not caring about overly huge given seconds in this call: assuming data will be in an expected range of [0, 24 hours)
          if (Math.floor(givenSeconds / 3600) > 0) {
              timeString += Math.floor(givenSeconds / 3600).toString() + ":";
              givenSeconds = givenSeconds - 3600 * Math.floor(givenSeconds / 3600);
          }
          var workVal:number = Math.floor(givenSeconds / 60);
          if (timeString.length > 0 && workVal <= 9)
              timeString += "0"; // report as h:mm:ss with 2 digits always for minutes only if there are hours present (otherwise m:ss is ok)
          timeString += workVal.toString() + ":";
          workVal = givenSeconds - (60 * workVal);
          if (Math.floor(workVal) < 10) {
              timeString += "0"; // always report seconds as two digits since we are always keeping minutes, even if 0, e.g., 0:03, 0:23, etc.
          }
          timeString += Math.floor(workVal).toString();
          return timeString;
      }
  }

  getOverlayClass(activeClass: string, inactiveClass: string): any {
      return !this.playing || this.isMouseMoving ? activeClass : inactiveClass;
  }

  private setVideoSrc(src: string | MediaSource | Blob): void {
    if (this.srcObjectURL) {
      URL.revokeObjectURL(this.srcObjectURL);
      this.srcObjectURL = null;
    }

    if (!this.video || !this.video.nativeElement) {
      return;
    }

    // NOTE: In Feb. 2022, developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject noted the following:
    // Older versions of the Media Source specification required using createObjectURL() to create an object URL then setting src to that URL.
    // Now you can just set srcObject to the MediaStream directly.

    if (!src) {
      this.video.nativeElement.src = null;
      if ("srcObject" in HTMLVideoElement.prototype) {
        this.video.nativeElement.srcObject = new MediaStream();
      }
    }
    else if (typeof src === "string") {
      this.video.nativeElement.src = src;
    }
    else if ("srcObject" in HTMLVideoElement.prototype) {
      this.video.nativeElement.srcObject = src;
    }
    else {
      this.srcObjectURL = URL.createObjectURL(src);
      this.video.nativeElement.src = this.srcObjectURL;
    }

    this.video.nativeElement.muted = this.muted();
  }

  newPositionAsPercent(percentOffset: number) {
      var newTime: number;
      this.isPercentInFlux = false; // signal that this.curTimePercent can again be updated when this.time is updated
      if (percentOffset >= 0 && percentOffset <= this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING && percentOffset != this.curTimePercent) {
          const videoPerhaps: HTMLVideoElement | null = this.getVideoTag();
          if (videoPerhaps)
          {
              newTime = videoPerhaps.duration * (percentOffset / 100);
              if (percentOffset == this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING)
              { // Protect against weird case when MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING < 100, say it's 99 so we only go to 99% --
                // a playing video will cause this.curTimePercent to be 98, 99, then max out at 99 even though the time is past that.
                // Rather than get into a potential cycle of the video position being after 99% and be pushed back to 99% with a potential
                // jitter of playing 99%, after that -- seek back to 99% because of the position lock to 99%, etc., do not allow this call,
                // newPositionAsPercent, to allow a roll-back of video from the range [99%, 100%] back to 99%.
                // Always allow an advancement up to 99%.
                  if (this.time < newTime)
                      this.time = newTime;
              }
              else // proceed with updated time adjustment
                  this.time = newTime;
          }
      }
  }

  notePercentIsInFlux() {
    // If video is playing and user starts manipulating slider, we do not want the slider via this.curTimePercent
    // to jump away from user control to where the video play head is.  Signal that the slider should be left alone,
    // i.e., that curTimePercent should be left alone, until the slider stabilizes (and newPositionAsPercent is called).
    this.isPercentInFlux = true; // this turns off updating of this.curTimePercent within this.time setter
  }

  actOnRewind() {
      var newPercentOffset = this.curTimePercent - this.OFFSET_FOR_FFWD_AND_REWIND;
      if (newPercentOffset < 0)
          newPercentOffset = 0;
      if (newPercentOffset < this.curTimePercent) {
          // Move back.
          this.isPercentInFlux = true;
          this.newPositionAsPercent(newPercentOffset);
      }
  }

  actOnFastForward() {
    var newPercentOffset = this.curTimePercent + this.OFFSET_FOR_FFWD_AND_REWIND;
    if (newPercentOffset > this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING)
        newPercentOffset = this.MAX_PERCENT_FOR_VIDEO_TIME_USER_SETTING;
    if (newPercentOffset > this.curTimePercent) {
        // Move ahead.
        this.isPercentInFlux = true;
        this.newPositionAsPercent(newPercentOffset);
    }
  }

  actOnEndOfMedia() {
      setTimeout(() => this.mediaEndIssued.emit(), 0);
  }

  updatePlayingState(newState: boolean) {
    this.playing = newState;

    // if mouse is not moving, then set signal this.showMouseInUI based on opposite of playing state (playing --> hide mouse, not playing --> show mouse) but don't bother if mouse moving as
    // then we are wired into showing the mouse in the UI.
    if (!this.isMouseMoving)
        this.showMouseInUI.set(!this.playing); // always is equal to !this.playing || this.isMouseMoving which is !this.playing since this.isMouseMoving == false at this point
    
    if (newState && !this.firstPlayInitiated)
    {
      this.firstPlayInitiated = true;
      setTimeout(() => this.playStartedFirstTime.emit(), 0);
    }
  }

  updateCCDisplayState(newState: boolean) {
    if (newState != this.currentCCDisplayState) {
      this.currentCCDisplayState = newState;
      this.userSettingsManagerService.updateCCText(newState); // save for the next video's use, too
      if (!newState)
          this.liveAnnouncer.clear(); // clear out CC text from announcer, too, when CC is hidden
    }
  }

  handleCueChange($event) {
    let cues = $event.target.track.activeCues;
    if (cues && cues.length && cues.length > 0) {
        // For this corpus, the length should always be 1, i.e., at most 1 timed text item active for any given time.
        // Say the first, which ideally is the "only"
        this.activeCCPiece = this.removeLeadin(cues[0].text);
        this.liveAnnouncer.announce(this.activeCCPiece); // as asked for by accessibility experts, announce the closed captioning
    }
  }

  removeLeadin(givenCueText): string {
      if (givenCueText && givenCueText.length && givenCueText.length > 0) {
        var cueText: string = givenCueText;
        if (cueText.search("<v") == 0) {
            // removing leading <v...> portion
            var legalStart: number = cueText.search(">");
            if (legalStart > 1)
                return cueText.substring(legalStart + 1); // return all that follows the <v..> piece
        }
        // Give up.  Echo back cueText and hope there is no special characters in it
        return cueText;
      }
      else
        return "";
  }
}

