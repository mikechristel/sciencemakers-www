import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { GlobalState } from '../app.global-state';

// The purpose of this service is to retrieve and store in localStorage the autoplay and autoadvance user settings.
// NOTE: for ScienceMakers, Topic Search is never shown; also there is no UI to turn these following facets on, i.e., they are always hidden:
// showStoryJobTypeFacetFilter, showBiographyJobTypeFacetFilter (furthermore, Category is always off instead of always on as is seen in parent The HistoryMakers Digital Archive)
@Injectable()
export class UserSettingsManagerService {
    public autoplayVideo: Subject<boolean> = new Subject<boolean>();
    public autoplayVideo$ = this.autoplayVideo.asObservable();

    public autoadvanceVideo: Subject<boolean> = new Subject<boolean>();
    public autoadvanceVideo$ = this.autoadvanceVideo.asObservable();

    public showCCText: Subject<boolean> = new Subject<boolean>();
    public showCCText$ = this.showCCText.asObservable();

    public hideTopicSearch: Subject<boolean> = new Subject<boolean>();
    public hideTopicSearch$ = this.hideTopicSearch.asObservable();

    public bioSearchFieldsMask: Subject<number> = new Subject<number>();
    public bioSearchFieldsMask$ = this.bioSearchFieldsMask.asObservable();

    public showBiographyLastNameFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showBiographyLastNameFacetFilter$ = this.showBiographyLastNameFacetFilter.asObservable();
    public showBiographyDecadeOfBirthFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showBiographyDecadeOfBirthFacetFilter$ = this.showBiographyDecadeOfBirthFacetFilter.asObservable();
    public showBiographyBirthStateFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showBiographyBirthStateFacetFilter$ = this.showBiographyBirthStateFacetFilter.asObservable();
    public showBiographyJobTypeFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showBiographyJobTypeFacetFilter$ = this.showBiographyJobTypeFacetFilter.asObservable();
    public showStoryUSStateFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryUSStateFacetFilter$ = this.showStoryUSStateFacetFilter.asObservable();
    public showStoryOrganizationFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryOrganizationFacetFilter$ = this.showStoryOrganizationFacetFilter.asObservable();
    public showStoryDecadeFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryDecadeFacetFilter$ = this.showStoryDecadeFacetFilter.asObservable();
    public showStoryYearFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryYearFacetFilter$ = this.showStoryYearFacetFilter.asObservable();
    public showStoryJobTypeFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryJobTypeFacetFilter$ = this.showStoryJobTypeFacetFilter.asObservable();
    public showStoryDecadeOfBirthFacetFilter: Subject<boolean> = new Subject<boolean>();
    public showStoryDecadeOfBirthFacetFilter$ = this.showStoryDecadeOfBirthFacetFilter.asObservable();

    public bioIDToFocus: Subject<string> = new Subject<string>();
    public bioIDToFocus$ = this.bioIDToFocus.asObservable();
    public storyIDToFocus: Subject<number> = new Subject<number>();
    public storyIDToFocus$ = this.storyIDToFocus.asObservable();

    private AUTOPLAY_SETTING_NAME: string = "sm-autoplay";
    private AUTOADVANCE_SETTING_NAME: string = "sm-autoadvance";
    private CCTEXT_SETTING_NAME: string = "sm-cctext";
    private HIDE_TOPIC_SEARCH_SETTING_NAME: string = "sm-hidetopicsearch";
    private BIO_SEARCH_FIELDS_MASK_NAME: string = "sm-biosearchfieldsmask";
    private SHOWBIOGRAPHY_LASTNAME_FACETFILTER: string = "sm-biolastnamefilter";
    private SHOWBIOGRAPHY_BIRTHDECADE_FACETFILTER: string = "sm-biobirthdecadefilter";
    private SHOWBIOGRAPHY_BIRTHSTATE_FACETFILTER: string = "sm-biobirthstatefilter";
    private SHOWSTORY_STATE_FACETFILTER: string = "sm-storystatefilter";
    private SHOWSTORY_ORG_FACETFILTER: string = "sm-storyorgfilter";
    private SHOWSTORY_DECADE_FACETFILTER: string = "sm-storydecadefilter";
    private SHOWSTORY_YEAR_FACETFILTER: string = "sm-storyyearfilter";
    private SHOWSTORY_BIRTHDECADE_FACETFILTER: string = "sm-storybirthdecadefilter";

    private BIO_ID_TO_FOCUS: string = "sm-bioIDToFocus";
    private STORY_ID_TO_FOCUS: string = "sm-storyIDToFocus";

    private localAutoplay: boolean = false;
    private localAutoadvance: boolean = false;
    private localCCText: boolean = false;
    private localBioSearchMask: number = 0;

    private localHideTopicSearch: boolean = false;

    private localShowBiographyLastNameFacetFilter: boolean = false;
    private localShowBiographyDecadeOfBirthFacetFilter: boolean = false;
    private localShowBiographyBirthStateFacetFilter: boolean = false;
    private localShowBiographyJobTypeFacetFilter: boolean = false;
    private localShowStoryUSStateFacetFilter: boolean = false;
    private localShowStoryOrganizationFacetFilter: boolean = false;
    private localShowStoryDecadeFacetFilter: boolean = false;
    private localShowStoryYearFacetFilter: boolean = false;
    private localShowStoryJobTypeFacetFilter: boolean = false;
    private localShowStoryDecadeOfBirthFacetFilter: boolean = false;

    private localBioIDToFocus: string;
    private localStoryIDToFocus: number;

    constructor(private globalState: GlobalState) {
        var temp: string;
        temp = JSON.parse(localStorage.getItem(this.AUTOPLAY_SETTING_NAME) || "0");
        this.localAutoplay = (temp == "1");
        this.autoplayVideo.next(this.localAutoplay);
        temp = JSON.parse(localStorage.getItem(this.AUTOADVANCE_SETTING_NAME) || "0");
        this.localAutoadvance = (temp == "1");
        this.autoadvanceVideo.next(this.localAutoadvance);
        temp = JSON.parse(localStorage.getItem(this.CCTEXT_SETTING_NAME) || "0");
        this.localCCText = (temp == "1");
        this.showCCText.next(this.localCCText);

        this.localHideTopicSearch = true; // NOTE: for ScienceMakers, this is always true (revisit if we consider "Great Story" to be reflecting a ScienceMaker's perspective, etc.)
        this.hideTopicSearch.next(this.localHideTopicSearch);

        temp = JSON.parse(localStorage.getItem(this.BIO_SEARCH_FIELDS_MASK_NAME) || "0");
        var tryAsNumber = +temp;
        if (tryAsNumber != null && tryAsNumber > 0)
            this.localBioSearchMask = tryAsNumber;
        else
            this.localBioSearchMask = this.defaultBioSearchFieldsMask();

        this.bioSearchFieldsMask.next(this.localBioSearchMask);

        // By default, show the last name, birth state for Biographies and hide the birth decade and job type
        temp = JSON.parse(localStorage.getItem(this.SHOWBIOGRAPHY_LASTNAME_FACETFILTER) || "1");
        this.localShowBiographyLastNameFacetFilter = (temp == "1");
        this.showBiographyLastNameFacetFilter.next(this.localShowBiographyLastNameFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWBIOGRAPHY_BIRTHSTATE_FACETFILTER) || "1");
        this.localShowBiographyBirthStateFacetFilter = (temp == "1");
        this.showBiographyBirthStateFacetFilter.next(this.localShowBiographyBirthStateFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWBIOGRAPHY_BIRTHDECADE_FACETFILTER) || "0");
        this.localShowBiographyDecadeOfBirthFacetFilter = (temp == "1");
        this.showBiographyDecadeOfBirthFacetFilter.next(this.localShowBiographyDecadeOfBirthFacetFilter);

        this.localShowBiographyJobTypeFacetFilter = false; // NOTE: for ScienceMakers, this is always false
        this.showBiographyJobTypeFacetFilter.next(this.localShowBiographyJobTypeFacetFilter);

        // By default, show the U.S. state, decade, and year for stories and hide the organization, job type, and birth decade of interviewee
        temp = JSON.parse(localStorage.getItem(this.SHOWSTORY_STATE_FACETFILTER) || "1");
        this.localShowStoryUSStateFacetFilter = (temp == "1");
        this.showStoryUSStateFacetFilter.next(this.localShowStoryUSStateFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWSTORY_DECADE_FACETFILTER) || "1");
        this.localShowStoryDecadeFacetFilter = (temp == "1");
        this.showStoryDecadeFacetFilter.next(this.localShowStoryDecadeFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWSTORY_YEAR_FACETFILTER) || "1");
        this.localShowStoryYearFacetFilter = (temp == "1");
        this.showStoryYearFacetFilter.next(this.localShowStoryYearFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWSTORY_ORG_FACETFILTER) || "0");
        this.localShowStoryOrganizationFacetFilter = (temp == "1");
        this.showStoryOrganizationFacetFilter.next(this.localShowStoryOrganizationFacetFilter);

        this.localShowStoryJobTypeFacetFilter = false; // NOTE: for ScienceMakers, this is always false
        this.showStoryJobTypeFacetFilter.next(this.localShowStoryJobTypeFacetFilter);
        temp = JSON.parse(localStorage.getItem(this.SHOWSTORY_BIRTHDECADE_FACETFILTER) || "0");
        this.localShowStoryDecadeOfBirthFacetFilter = (temp == "1");
        this.showStoryDecadeOfBirthFacetFilter.next(this.localShowStoryDecadeOfBirthFacetFilter);

        this.localBioIDToFocus = this.globalState.NO_ACCESSION_CHOSEN;
        this.bioIDToFocus.next(this.localBioIDToFocus);
        this.localStoryIDToFocus = this.globalState.NOTHING_CHOSEN;
        this.storyIDToFocus.next(this.localStoryIDToFocus);
    }

    ngOnInit() {
        this.autoplayVideo.next(this.localAutoplay);
        this.autoadvanceVideo.next(this.localAutoadvance);
        this.showCCText.next(this.localCCText);
        this.bioSearchFieldsMask.next(this.localBioSearchMask);
        this.hideTopicSearch.next(this.localHideTopicSearch);

        this.showBiographyLastNameFacetFilter.next(this.localShowBiographyLastNameFacetFilter);
        this.showBiographyDecadeOfBirthFacetFilter.next(this.localShowBiographyDecadeOfBirthFacetFilter);
        this.showBiographyBirthStateFacetFilter.next(this.localShowBiographyBirthStateFacetFilter);
        this.showBiographyJobTypeFacetFilter.next(this.localShowBiographyJobTypeFacetFilter);
        this.showStoryUSStateFacetFilter.next(this.localShowStoryUSStateFacetFilter);
        this.showStoryOrganizationFacetFilter.next(this.localShowStoryOrganizationFacetFilter);
        this.showStoryDecadeFacetFilter.next(this.localShowStoryDecadeFacetFilter);
        this.showStoryYearFacetFilter.next(this.localShowStoryYearFacetFilter);
        this.showStoryJobTypeFacetFilter.next(this.localShowStoryJobTypeFacetFilter);
        this.showStoryDecadeOfBirthFacetFilter.next(this.localShowStoryDecadeOfBirthFacetFilter);
        this.bioIDToFocus.next(this.localBioIDToFocus);
        this.storyIDToFocus.next(this.localStoryIDToFocus);
    }


    public currentAutoplay(): boolean {
        return this.localAutoplay;
    }

    public currentAutoadvance(): boolean {
        return this.localAutoadvance;
    }

    public currentCCText(): boolean {
        return this.localCCText;
    }

    public currentBioSearchFieldsMask(): number {
        return this.localBioSearchMask;
    }

    public currentHideTopicSearch(): boolean {
        return this.localHideTopicSearch;
    }

    public defaultBioSearchFieldsMask(): number {
        // Consider this return value (a bitwise "or" of values) as the default for this setting:
        return this.globalState.BiographySearchPreferredName_On | this.globalState.BiographySearchLastName_On | this.globalState.BiographySearchDescriptionShort_On;
    }

    public currentShowBiographyBirthStateFacetFilter(): boolean {
        return this.localShowBiographyBirthStateFacetFilter;
    }

    public currentShowBiographyDecadeOfBirthFacetFilter(): boolean {
        return this.localShowBiographyDecadeOfBirthFacetFilter;
    }

    public currentShowBiographyJobTypeFacetFilter(): boolean {
        return this.localShowBiographyJobTypeFacetFilter;
    }

    public currentShowBiographyLastNameFacetFilter(): boolean {
        return this.localShowBiographyLastNameFacetFilter;
    }

    public currentShowStoryUSStateFacetFilter(): boolean {
        return this.localShowStoryUSStateFacetFilter;
    }

    public currentShowStoryDecadeFacetFilter(): boolean {
        return this.localShowStoryDecadeFacetFilter;
    }

    public currentShowStoryYearFacetFilter(): boolean {
        return this.localShowStoryYearFacetFilter;
    }

    public currentShowStoryOrganizationFacetFilter(): boolean {
        return this.localShowStoryOrganizationFacetFilter;
    }

    public currentShowStoryJobTypeFacetFilter(): boolean {
        return this.localShowStoryJobTypeFacetFilter;
    }

    public currentShowStoryDecadeOfBirthFacetFilter(): boolean {
        return this.localShowStoryDecadeOfBirthFacetFilter;
    }

    public updateAutoPlay(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localAutoplay != newBooleanSetting) {
            localStorage.setItem(this.AUTOPLAY_SETTING_NAME, temp);
            this.localAutoplay = newBooleanSetting;
            this.autoplayVideo.next(this.localAutoplay);
        }
    }

    public updateAutoAdvance(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localAutoadvance != newBooleanSetting) {
            localStorage.setItem(this.AUTOADVANCE_SETTING_NAME, temp);
            this.localAutoadvance = newBooleanSetting;
            this.autoadvanceVideo.next(this.localAutoadvance);
        }
    }

    public updateHideTopicSearch(newSetting: boolean) {
      var temp: string;
      if (newSetting)
        temp = "1";
      else
        temp = "0";
      var newBooleanSetting: boolean = (temp == "1");
      if (this.localHideTopicSearch != newBooleanSetting) {
          localStorage.setItem(this.HIDE_TOPIC_SEARCH_SETTING_NAME, temp);
          this.localHideTopicSearch = newBooleanSetting;
          this.hideTopicSearch.next(this.localHideTopicSearch);
      }
  }

  public updateShowBiographyBirthStateFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowBiographyBirthStateFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWBIOGRAPHY_BIRTHSTATE_FACETFILTER, temp);
            this.localShowBiographyBirthStateFacetFilter = newBooleanSetting;
            this.showBiographyBirthStateFacetFilter.next(this.localShowBiographyBirthStateFacetFilter);
        }
    }

    public updateShowBiographyDecadeOfBirthFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowBiographyDecadeOfBirthFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWBIOGRAPHY_BIRTHDECADE_FACETFILTER, temp);
            this.localShowBiographyDecadeOfBirthFacetFilter = newBooleanSetting;
            this.showBiographyDecadeOfBirthFacetFilter.next(this.localShowBiographyDecadeOfBirthFacetFilter);
        }
    }

    public updateShowBiographyLastNameFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowBiographyLastNameFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWBIOGRAPHY_LASTNAME_FACETFILTER, temp);
            this.localShowBiographyLastNameFacetFilter = newBooleanSetting;
            this.showBiographyLastNameFacetFilter.next(this.localShowBiographyLastNameFacetFilter);
        }
    }

    public updateShowStoryUSStateFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowStoryUSStateFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWSTORY_STATE_FACETFILTER, temp);
            this.localShowStoryUSStateFacetFilter = newBooleanSetting;
            this.showStoryUSStateFacetFilter.next(this.localShowStoryUSStateFacetFilter);
        }
    }

    public updateShowStoryOrganizationFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowStoryOrganizationFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWSTORY_ORG_FACETFILTER, temp);
            this.localShowStoryOrganizationFacetFilter = newBooleanSetting;
            this.showStoryOrganizationFacetFilter.next(this.localShowStoryOrganizationFacetFilter);
        }
    }

    public updateShowStoryDecadeFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowStoryDecadeFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWSTORY_DECADE_FACETFILTER, temp);
            this.localShowStoryDecadeFacetFilter = newBooleanSetting;
            this.showStoryDecadeFacetFilter.next(this.localShowStoryDecadeFacetFilter);
        }
    }

    public updateShowStoryYearFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowStoryYearFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWSTORY_YEAR_FACETFILTER, temp);
            this.localShowStoryYearFacetFilter = newBooleanSetting;
            this.showStoryYearFacetFilter.next(this.localShowStoryYearFacetFilter);
        }
    }

    public updateShowStoryDecadeOfBirthFacetFilter(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localShowStoryDecadeOfBirthFacetFilter != newBooleanSetting) {
            localStorage.setItem(this.SHOWSTORY_BIRTHDECADE_FACETFILTER, temp);
            this.localShowStoryDecadeOfBirthFacetFilter = newBooleanSetting;
            this.showStoryDecadeOfBirthFacetFilter.next(this.localShowStoryDecadeOfBirthFacetFilter);
        }
    }


    // NOTE: unlike most other settings, the UI to change CC is with the video player, not in a settings page
    // and so this is NOT called from user-settings.component but rather from my-video.component.
    public updateCCText(newSetting: boolean) {
        var temp: string;
        if (newSetting)
          temp = "1";
        else
          temp = "0";
        var newBooleanSetting: boolean = (temp == "1");
        if (this.localCCText != newBooleanSetting) {
            localStorage.setItem(this.CCTEXT_SETTING_NAME, temp);
            this.localCCText = newBooleanSetting;
            this.showCCText.next(this.localCCText);
        }
    }

    // NOTE: unlike most other settings, the UI to change bio search bitmask is with the biography advanced search form, not in a settings page
    // and so this is NOT called from user-settings.component but rather from search-form.component.
    public updateBioSearchFieldsMask(newSetting: number) {
        if (newSetting != this.localBioSearchMask) {
            localStorage.setItem(this.BIO_SEARCH_FIELDS_MASK_NAME, newSetting.toString());
            this.localBioSearchMask = newSetting;
            this.bioSearchFieldsMask.next(this.localBioSearchMask);
        }
    }

    public currentBioIDToFocus(): string {
        return this.localBioIDToFocus;
    }

    // NOTE: settings for what element to focus on after a route navigation is controlled
    // in internal routing/navigation, not through a settings interface.
    public updateBioIDToFocus(newSetting: string) {
        if (newSetting != this.localBioIDToFocus) {
            localStorage.setItem(this.BIO_ID_TO_FOCUS, newSetting);
            this.localBioIDToFocus = newSetting;
            this.bioIDToFocus.next(this.localBioIDToFocus);
        }
    }

    public currentStoryIDToFocus(): number {
        return this.localStoryIDToFocus;
    }

    public updateStoryIDToFocus(newSetting: number) {
        if (newSetting != this.localStoryIDToFocus) {
            localStorage.setItem(this.STORY_ID_TO_FOCUS, newSetting.toString());
            this.localStoryIDToFocus = newSetting;
            this.storyIDToFocus.next(this.localStoryIDToFocus);
        }
    }
}
