import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

// The purpose of this service is to retrieve and store in localStorage the autoplay and autoadvance user settings.
// These settings are accessible to service users through
@Injectable()
export class UserSettingsManagerService {
  public autoplayVideo: Subject<boolean> = new Subject<boolean>();
  public autoplayVideo$ = this.autoplayVideo.asObservable();
  public autoadvanceVideo: Subject<boolean> = new Subject<boolean>();
  public autoadvanceVideo$ = this.autoadvanceVideo.asObservable();

  private AUTOPLAY_SETTING_NAME: string = "autoplay";
  private AUTOADVANCE_SETTING_NAME: string = "autoadvance";
  private localAutoplay: boolean = false;
  private localAutoadvance: boolean = false;

  constructor() {
      var temp: string;
      temp = JSON.parse(localStorage.getItem(this.AUTOPLAY_SETTING_NAME) || "0");
      this.localAutoplay = (temp == "1");
      this.autoplayVideo.next(this.localAutoplay);
      temp = JSON.parse(localStorage.getItem(this.AUTOADVANCE_SETTING_NAME) || "0");
      this.localAutoadvance = (temp == "1");
      this.autoadvanceVideo.next(this.localAutoadvance);
  }

  ngOnInit() {
    this.autoplayVideo.next(this.localAutoplay);
    this.autoadvanceVideo.next(this.localAutoadvance);
  }

  public currentAutoplay(): boolean {
      return this.localAutoplay;
  }

  public currentAutoadvance(): boolean {
      return this.localAutoadvance;
  }

  public updateAutoPlay(newSetting: boolean) {
    var temp: string;
    if (newSetting)
      temp = "1";
    else
      temp = "0";
    localStorage.setItem(this.AUTOPLAY_SETTING_NAME, temp);
    this.localAutoplay = (temp == "1");
    this.autoplayVideo.next(this.localAutoplay);
  }

  public updateAutoAdvance(newSetting: boolean) {
    var temp: string;
    if (newSetting)
      temp = "1";
    else
      temp = "0";
    localStorage.setItem(this.AUTOADVANCE_SETTING_NAME, temp);
    this.localAutoadvance = (temp == "1");
    this.autoadvanceVideo.next(this.localAutoadvance);
  }

}
