import { Component, OnInit, OnDestroy, ElementRef, Input, Output, EventEmitter, ViewEncapsulation, Renderer, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { VgCoreModule }         from 'videogular2/core';
import { VgControlsModule }     from 'videogular2/controls';
import { VgOverlayPlayModule }  from 'videogular2/overlay-play';
import { VgBufferingModule }    from 'videogular2/buffering';
import { VgAPI }                from 'videogular2/core';

import { UserSettingsManagerService } from '../../user-settings/user-settings-manager.service';
import { GlobalState }          from '../../app.global-state';
import { Subscription }         from 'rxjs/Subscription';

@Component({
  selector: 'video-js',
  templateUrl: './video-js.component.html',
  styleUrls: ['./video-js.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class VideoJSComponent implements OnInit {
  @ViewChild('media') videoPlayerRef: any;

  // communicates transcript time and end of video to parent component
  @Output() time: EventEmitter<any> = new EventEmitter();
  @Output() end: EventEmitter<any> = new EventEmitter();
  @Output() toggleWide: EventEmitter<any> = new EventEmitter();
  @Output() loaded: EventEmitter<any> = new EventEmitter();

  @Input() url: any;
  @Input() poster: string;
  @Input() idx: string;

  private _elementRef: ElementRef
  private player: any;
  public toggleWideScreen: boolean;
  public wideScreenMessage: string;

  public api: VgAPI;

  private autoPlaySubscription: Subscription;
  defaultAutoPlay: boolean;

  constructor(elementRef: ElementRef, private _renderer: Renderer, private userSettingsManagerService: UserSettingsManagerService) {
    this.autoPlaySubscription = userSettingsManagerService.autoplayVideo$.subscribe((value) => {
      this.defaultAutoPlay = value;
    })
    this.url = false;
    this.player = false;
    this.toggleWideScreen = false;
    this.wideScreenMessage = "Theater Mode";
  }

  ngOnInit() {
    this.defaultAutoPlay = this.userSettingsManagerService.currentAutoplay();
    this.loaded.emit();
  }

  isLoaded() {
    this.loaded.emit();
    this.api.volume = GlobalState.volume;
  }

  setVolume() {
    GlobalState.volume = this.api.volume;
  }

  onPlayerReady(api: VgAPI) {
      this.api = api;
      this.isLoaded();
      // NOTE: There are many cautions against using autoplay, e.g., https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/autoplay --
      // leave it up to the user to turn it on if he/she so desires.
      this._renderer.setElementProperty(this.videoPlayerRef.nativeElement, 'autoplay', this.defaultAutoPlay);
  }

  toggleWideView() {
    this.toggleWide.emit(this.toggleWideScreen);
    this.wideScreenMessage === "Theater Mode" ? this.wideScreenMessage = "Default Mode" : this.wideScreenMessage = "Theater Mode";
  }

  updateTime() {
    this.time.emit(this.api.getDefaultMedia().currentTime);
  }

  nextVideo() {
    this.end.emit();
  }

  setCurrentTime(newValInSecs) {
    this._renderer.setElementProperty(this.videoPlayerRef.nativeElement, 'currentTime', newValInSecs);
  }

}
