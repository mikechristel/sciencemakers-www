import { Component, ElementRef, inject, viewChild, ChangeDetectorRef }       from '@angular/core';
import { Router, NavigationEnd, RouterLinkActive, RouterLink } from '@angular/router';

import { FeedbackService } from './feedback/feedback.service';
import { AuthManagerService } from './auth/auth-manager.service';
import { PlaylistManagerService } from './playlist-manager/playlist-manager.service';
import { Playlist } from './playlist-manager/playlist';
import { takeUntil } from "rxjs/operators";

import { SearchFormService } from './shared/search-form/search-form.service';
import { SearchFormOptions } from './shared/search-form/search-form-options';

import { TitleManagerService } from './shared/title-manager.service';

import { RouterHistoryService } from './shared/services';

import { BaseComponent } from './shared/base.component';
import { UserSettingsManagerService } from './user-settings/user-settings-manager.service';

import { StorySetType} from './storyset/storyset-type';

import { AppContentsComponent } from './app-contents/app-contents.component';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterLinkActive, RouterLink, AppContentsComponent, CdkTrapFocus, FormsModule, CdkCopyToClipboard]
})

export class AppComponent extends BaseComponent {
    router = inject(Router);
    private routerHistoryService = inject(RouterHistoryService);
    private feedbackService = inject(FeedbackService);
    private searchFormService = inject(SearchFormService);
    private titleManagerService = inject(TitleManagerService);
    private userSettingsManagerService = inject(UserSettingsManagerService);
    private playlistManagerService = inject(PlaylistManagerService);
    private authManagerService = inject(AuthManagerService);

    private changeDetectorRef = inject(ChangeDetectorRef);

    readonly feedbackInputArea = viewChild<ElementRef>('feedbackInput');
    readonly myClipsTitleInputArea = viewChild<ElementRef>('myClipsTitleInput');
    readonly clipsListInputArea = viewChild<ElementRef>('clipsListInput');

    public givenFeedback: string = null;
    public optionalFeedbackEmail: string = null;
    public givenLoadClips: string = null;
    public myClips: Playlist[];
    public myClipsWithCountMsg: string;

    public showMyContactUsModalForm: boolean = false;
    public showMyExportMyClipsModalForm: boolean = false;
    public showMyConfirmClearingMyClipsModalForm: boolean = false;
    public showMyConfirmReloadModalForm: boolean = false;
    public showMyLoadClipsModalForm: boolean = false;

    public inSearchFormRoute: boolean = false;
    public inContentLinksRoute: boolean = false;
    public inShowingManyItemsRoute: boolean = false; // for any of biography set, story set, one biography story set

    public cachedTitle: string;
    public myClipsTitleCandidate: string;
    public myClipsTitleMaxLength: number = 140;
    public myClipsTitleLengthHelper: string = "lengthLimitInfoForMyClipsTitle"; // ID for which char count in title is given
    public myClipsURLCopyActionFresh: boolean = false;

    // Via RouterHistoryService
    previousUrlViaRouterHistoryService$ = this.routerHistoryService.previousUrl$;
    currentUrlViaRouterHistoryService$ = this.routerHistoryService.currentUrl$;

    constructor() {

        super();  // since this is a derived class from BaseComponent
        const feedbackService = this.feedbackService;
        const userSettingsManagerService = this.userSettingsManagerService;
        const playlistManagerService = this.playlistManagerService;
        const authManagerService = this.authManagerService;

        // Get subscriptions tied in using best practice recommendation for how to unsubscribe, here and
        // below in this component wherever .subscribe is used:
        playlistManagerService.myClips$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            this.myClips = value;
            this.setMyClipsCountMessage();
            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });

        playlistManagerService.presentMyClipsExportForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyExportMyClipsModalForm();
        });

        playlistManagerService.presentClipsLoadForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyLoadClipsModalForm();
        });

        playlistManagerService.presentMyClipsConfirmClearingForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyConfirmClearMyClipsModalForm();
        });

        authManagerService.presentConfirmReloadForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyConfirmReloadModalForm();
        });

        feedbackService.presentFeedbackInputForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyContactUsModalForm();
        });

        // Certain UI features toggle on/off in this component's html rendering based on settings like "are we in a search form" (advanced search decoration on), etc.
        this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe(event => {
          if (event instanceof NavigationEnd) {

            var somethingChanged: boolean = false;
            var inspectedURL: string = event.urlAfterRedirects;
            var updated_inSearchFormRoute: boolean;
            var updated_inContentLinksRoute: boolean = this.inContentLinksRoute;
            var updated_inShowingManyItemsRoute: boolean = this.inShowingManyItemsRoute;

            updated_inSearchFormRoute = (inspectedURL.startsWith("/search") || inspectedURL.startsWith("/storyadvs")
                                       || inspectedURL.startsWith("/bioadvs") || inspectedURL.startsWith("/tag")); // NOTE: considering tag/topic search route a search form, too
            if (updated_inSearchFormRoute) {
              this.inContentLinksRoute = false;
              this.inShowingManyItemsRoute = false;
            }
            else
            {
              updated_inShowingManyItemsRoute = (inspectedURL.startsWith("/all") || inspectedURL.startsWith("/stories/")
                || inspectedURL.startsWith("/storiesForBio"));
              if (updated_inShowingManyItemsRoute) {
                updated_inContentLinksRoute = false;
              }
              else {
                updated_inContentLinksRoute = inspectedURL.startsWith("/contentlinks");
              }
            }
            somethingChanged = (updated_inSearchFormRoute != this.inSearchFormRoute) || (updated_inContentLinksRoute != this.inContentLinksRoute) || 
              (updated_inShowingManyItemsRoute != this.inShowingManyItemsRoute);

            if (somethingChanged) {
                this.inSearchFormRoute = updated_inSearchFormRoute;
                this.inContentLinksRoute = updated_inContentLinksRoute;
                this.inShowingManyItemsRoute = updated_inShowingManyItemsRoute;
                this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
            }
          }
        });
    }

    private setMyClipsCountMessage() {
        var storyCount: number = 0;
        if (this.myClips)
            storyCount = this.myClips.length;

        if (storyCount == 1)
            this.myClipsWithCountMsg = "My Clips, 1 story";
        else
            this.myClipsWithCountMsg = "My Clips, " + storyCount + " stories";
    }

    ngOnInit() {
        this.myClips = this.playlistManagerService.initializeMyClips();
        this.setMyClipsCountMessage();
    }

    openContentLinks() {
      this.router.navigate(['/contentlinks']);
    }

    scrollHeaderIntoView(headerID: string) {
        // !!!TBD!!! Ideally we never need to use document, and ideally we can make use of newer Angular 9+ patterns like ViewportScroller.
        // See https://stackoverflow.com/questions/36101756/angular2-routing-with-hashtag-to-page-anchor for context.
        setTimeout(() => {
            const anchor = document.getElementById(headerID);
            if (anchor) {
                anchor.focus();
                anchor.scrollIntoView();
                this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
            }
        });
    }

    isRouteActive(routeToCheck: string): boolean {
        return (this.router && this.router.url && this.router.url == routeToCheck);
    }

    setNavChoice(newRoute: string) {
        if (!this.isRouteActive(newRoute)) {
            var routerCommands: string[] = [];
            routerCommands.push(newRoute);
            this.router.navigate(routerCommands);
        }
    }

    openMySimpleSearch() {
        // This search takes different forms, depending on the status of the search form service.
        // Pass the form in router parameters so that on a series of browser "go back" operations the
        // appropriate state of the search will be returned to (e.g., search stories, or just one person's stories, etc.).
        var moreNavigationParams = {};
        var currentSearchOptions: SearchFormOptions = this.searchFormService.currentSearchOptions();

        if (currentSearchOptions.searchingBiographies)
            moreNavigationParams['forBio'] = "1" ;
        else {
            moreNavigationParams['forBio'] = "0" ;
            if (currentSearchOptions.biographyAccessionID != "") {
                moreNavigationParams['ID'] = currentSearchOptions.biographyAccessionID; // search within this person's stories
            }
        }
        this.router.navigate(['/search', moreNavigationParams]);
    }

    openMyContactUsModalForm() {
        this.cachedTitle = this.titleManagerService.getTitle();
        this.titleManagerService.setTitle("Contact Us, ScienceMakers Digital Archive");
        this.showMyContactUsModalForm = true;
    }

    closeMyContactUsModalForm() {
        this.titleManagerService.setTitle(this.cachedTitle);
        this.showMyContactUsModalForm = false;
    }

    clearFeedback() {
        this.givenFeedback = null;
        this.optionalFeedbackEmail = null;
    }

    cancelFeedbackAndCloseMyModal() {
        this.givenFeedback = null;
        this.optionalFeedbackEmail = null;

        this.closeMyContactUsModalForm();
    }

    postFeedbackAndCloseMyModal() {
        var feedbackMessage: string;
        var feedbackEmail: string = null;

        if (this.givenFeedback) {
            feedbackMessage = this.givenFeedback.trim();
            if (feedbackMessage.length > 0) {
                if (this.optionalFeedbackEmail && this.optionalFeedbackEmail.trim().length > 0) {
                    // Clean up given email.
                    feedbackEmail = this.optionalFeedbackEmail.trim();
                }
                this.feedbackService.postFeedback(feedbackMessage, feedbackEmail);
            }
        }
        // Clear feedback after it is submitted:
        this.givenFeedback = null;
        this.optionalFeedbackEmail = null;

        this.closeMyContactUsModalForm();
    }


    openMyLoadClipsModalForm() {
      this.cachedTitle = this.titleManagerService.getTitle();
      this.titleManagerService.setTitle("Load Clips, ScienceMakers Digital Archive");
      this.showMyLoadClipsModalForm = true;
    }

    closeMyLoadClipsModalForm() {
        this.titleManagerService.setTitle(this.cachedTitle);
        this.showMyLoadClipsModalForm = false;
    }

    clearLoadClips() {
        this.givenLoadClips = null;
    }

  cancelLoadClipsAndCloseMyModal() {
      this.givenLoadClips = null;

      this.closeMyLoadClipsModalForm();
  }

  postLoadClipsAndCloseMyModal() {
      var clipsListMessage: string;

      if (this.givenLoadClips) {
        clipsListMessage = this.givenLoadClips.trim();
          if (clipsListMessage.length > 0) {
              // Process the loading of the given clips if they parse properly.
              // NOTE: %2C may be there instead of , -- do that substitution first.
              clipsListMessage = clipsListMessage.replace(/\s\s+/g, ' '); // consecutive whitespace turned into single space
              clipsListMessage = clipsListMessage.replace(/\%2C/gi, ',');
              // Allow 3 forms of input:
              // (a) just the comma-separated list of clip IDs (i.e., story IDs), e.g.: 192691,112044,39652,102297
              // (b) allow a comma-separated list of clip IDs and a title with parameter specification "IDList=" first, as in: IDList=379332,284402,99364;ListTitle=stuff
              // (c) allow ANY sort of formatted story set with "IDList=" as the first marker, as in: http://localhost:4200/stories/6;IDList=379332,284402,99364;ListTitle=stuff
              var iWork: number = clipsListMessage.indexOf("IDList=");
              var givenIDListString: string = "";
              var givenClipSetTitle: string = "";
              if (iWork >= 0) {
                // Found it: get ID list which ends with end of string or at the ; before a suffix of ";ListTitle="
                iWork += 7; // move past IDList= prefix (and any URI that preceded that as well)
                var iTitle: number = clipsListMessage.indexOf(";ListTitle=", iWork);
                if (iTitle >= 0)
                {
                  givenIDListString = clipsListMessage.substring(iWork, iTitle);
                  // List title given, so make use of it
                  givenClipSetTitle = clipsListMessage.substring(iTitle+11); // of course, 11 = string length of ";ListTitle="
                }
                else // assuming just the ID list:
                  givenIDListString = clipsListMessage.substring(iWork);
              }
              else // if special ID List parameter marker is not there, assume the whole list is the ID list
                givenIDListString = clipsListMessage;

              // Now, check the list for at least one ID in an assumed comma-separated list format of #,#,# etc.
              var givenIDs: string[] = givenIDListString.split(",");
              if (givenIDs.length > 0)
              {
                  // (!!!TBD!!!) Later, return to this code to optimize as needed: make given list of IDs into numbers without any number duplicates.
                  var keeperGivenIDs: number[] = [];
                  var i: number;
                  var properIDValue: number;
                  var stringToConsider: string;
                  var thinnedGivenIDListString: string = "";

                  for (i = 0; i < givenIDs.length; i++)
                  {
                    stringToConsider = givenIDs[i];
                    if (!isNaN(Number(stringToConsider)))
                    { // value makes sense to consider (all proper IDs are numbers)
                      properIDValue = Number(stringToConsider);
                      if (keeperGivenIDs.indexOf(properIDValue) == -1) {
                        // not seen as a duplicate, so keep it
                        keeperGivenIDs.push(properIDValue);
                        thinnedGivenIDListString += stringToConsider + ","; // making a comma-separated list of numbers without duplicates (don't worry about any "mess" like whitespace in the string ID, as it did parse)
                      }
                    }
                  }
                  if (thinnedGivenIDListString.length > 0)
                  { // have at least one numeric ID in given list, so continue with the route navigation
                      thinnedGivenIDListString = thinnedGivenIDListString.substring(0, thinnedGivenIDListString.length - 1); // take off extraneous comma at the end

                      var moreParams = {};

                      moreParams['IDList'] = thinnedGivenIDListString;
                      if (givenClipSetTitle.length > 0)
                        moreParams['ListTitle'] = givenClipSetTitle;

                      // NOTE: Hidden assumption that we are never on a route of '/stories/' + StorySetType.GivenIDSet when launching this navigation
                      // (in fact we are on the route of '/stories/' + StorySetType.MyClipsSet as only from My Clips do you get to load a given clips set).
                      this.router.navigate(['/stories/' + StorySetType.GivenIDSet, moreParams]);
                  }
              }
          }
        }
        // Clear clips list after it is submitted for loading:
        this.givenLoadClips = null;

        this.closeMyLoadClipsModalForm();
    }

    openMyConfirmReloadModalForm() {
        this.cachedTitle = this.titleManagerService.getTitle(); // browser window page title
        this.titleManagerService.setTitle("Confirm reload action, ScienceMakers Digital Archive");
        this.showMyConfirmReloadModalForm = true;
    }

    closeMyConfirmReloadModalForm() {
        this.titleManagerService.setTitle(this.cachedTitle);
        this.showMyConfirmReloadModalForm = false;
    }

    executeWindowReload() {
        // Do the window reload action.
        window.location.reload(); // reload the current page
    }

    // The functions below deal with the "My Clips Title/URL" exporting.
    openMyExportMyClipsModalForm() {
        if (this.myClipsTitleCandidate == null)
            this.myClipsTitleCandidate = "";
        this.cachedTitle = this.titleManagerService.getTitle(); // browser window page title
        this.titleManagerService.setTitle("Export your clips, ScienceMakers Digital Archive");
        this.showMyExportMyClipsModalForm = true;
    }

    closeMyExportMyClipsModalForm() {
        // NOTE:  accessibility experts asked for clarity in modal form with no side effects, and so
        // there is no persistence of the last title candidate entered: it is cleared so on next display of the
        // modal form, it starts off empty.  For that reason, "Clear" button removed as well, since on close
        // of the modal the myClipsTitleCandidate will be cleared.
        this.myClipsTitleCandidate = "";
        this.titleManagerService.setTitle(this.cachedTitle);
        this.myClipsURLCopyActionFresh = false;
        this.showMyExportMyClipsModalForm = false;
    }

    // The functions below deal with the "My Clips" clearing and getting a confirmation for this action.
    openMyConfirmClearMyClipsModalForm() {
        this.cachedTitle = this.titleManagerService.getTitle(); // browser window page title
        this.titleManagerService.setTitle("Confirm clearing your clips, ScienceMakers Digital Archive");
        this.showMyConfirmClearingMyClipsModalForm = true;
    }

    closeMyConfirmClearMyClipsModalForm() {
        this.titleManagerService.setTitle(this.cachedTitle);
        this.showMyConfirmClearingMyClipsModalForm = false;
    }

    clearMyClipsConfirmed() {
        // Clear My Clips back to an empty set.
        this.titleManagerService.setTitle(this.cachedTitle); // important this is done before clearMyClips() call which might trigger other title changes
        this.playlistManagerService.clearMyClips();
        this.showMyConfirmClearingMyClipsModalForm = false;
    }

    myTitledMyClipsURI(): string {
        // Via Angular 9+ directive cdkCopyToClipboard, copy to the clipboard.
        if (this.myClipsTitleCandidate && this.myClipsTitleCandidate.length > 0)
            return this.titledMyClipsAsURL(this.myClipsTitleCandidate);
        else
            return "";
    }

    private markMyClipsURICopyAsDone() {
        this.myClipsURLCopyActionFresh = true; // FYI, actual copy to clipboard done via Angular 9+ directive cdkCopyToClipboard
    }

    private titledMyClipsAsURL(titlePiece: string): string {
        // NOTE: assumptions exist here regarding the route fragment to get to a story set (/stories/6;IDList=)
        var retVal: string = "";
        var url: string = ""
        var favCount: number = this.myClips.length;
        if (favCount > 0) {
            retVal = this.myClips[0].storyID.toString();
            for (var i:number = 1; i < this.myClips.length; i++)
                retVal = retVal + "%2C" + this.myClips[i].storyID;
            url = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port: '') + "/stories/6;IDList=" + retVal;

            // NOTE: certain characters in router mess up router parsing, e.g., !
            // Rather than figure out nuances of router parsing, simplify what can be used
            // as a title to just alphanumeric and space.
            var cleanedTitle: string = titlePiece.replace(/\s\s+/g, ' '); // consecutive whitespace turned into single space
            cleanedTitle = cleanedTitle.replace(/[^a-zA-Z0-9 \-\,\'\"\_\.]/g, ''); // keep only alphanumeric, dash -, comma, single or double quote ' ", underscore _, period . and space, nothing else

            if (cleanedTitle) url = url + ";ListTitle=" + encodeURIComponent(cleanedTitle);
        }
        else url = "";
        return url;
    }

    private handleMyClipsTitleInput() {
        // Used to help label the characters left in the given myClips title in a modal form according to accessibility expert advice.
        // On "input", remove the aria-describedby attribute (by setting what it is bound to, myClipsTitleLengthHelper, to "") so
        // that on entering title characters this title length is not read incrementally and annoyingly.
        this.myClipsTitleLengthHelper = "";
        this.myClipsURLCopyActionFresh = false;
    }
    private handleMyClipsTitleInputBlur() {
        // Used to help label the characters left in the given myClips title in a modal form according to accessibility expert advice.
        // On "blur", restore the described by attribute for the textarea input element (bound to myClipsTitleLengthHelper)
        setTimeout(() => {
            this.myClipsTitleLengthHelper = "lengthLimitInfoForMyClipsTitle";
            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        }, 0);
    }
    private thinToLegalMyClipsTitleKeyUp() {
        // Purpose: thin out characters just like titledMyClipsAsURL behaves, i.e.,
        // keep only alphanumeric, dash -, comma, single or double quote ' ", underscore _, period . and space, nothing else
        if (this.myClipsTitleCandidate.match(/[^a-zA-Z0-9 \-\,\'\"\_\.]/g))
            this.myClipsTitleCandidate = this.myClipsTitleCandidate.replace(/[^a-zA-Z0-9 \-\,\'\"\_\.]/g, '');
    }
}
