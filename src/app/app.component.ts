import { Component, ViewChild, ElementRef }       from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

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

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent extends BaseComponent {
    @ViewChild('feedbackInput') feedbackInputArea: ElementRef;
    @ViewChild('myClipsTitleInput') myClipsTitleInputArea: ElementRef;

    public givenFeedback: string = null;
    public optionalFeedbackEmail: string = null;
    public myClips: Playlist[];
    public myClipsWithCountMsg: string;

    public showMyContactUsModalForm: boolean = false;
    public showMyExportMyClipsModalForm: boolean = false;
    public showMyConfirmClearingMyClipsModalForm: boolean = false;
    public showMyConfirmReloadModalForm: boolean = false;
    public inSearchFormRoute: boolean = false;
    public inContentLinksRoute: boolean = false;
    public inShowingManyItemsRoute: boolean = false; // for any of biography set, story set, one biography story set

    public cachedTitle: string;
    public myClipsTitleCandidate: string;
    public myClipsTitleMaxLength: number = 140;
    public myClipsTitleLengthHelper: string = "lengthLimitInfoForMyClipsTitle"; // ID for which char count in title is given
    public myClipsURLCopyActionFresh: boolean = false;

    public hideTopicSearch: boolean = false; // value will be read and set from userSettingsManagerService

    // Via RouterHistoryService
    previousUrlViaRouterHistoryService$ = this.routerHistoryService.previousUrl$;
    currentUrlViaRouterHistoryService$ = this.routerHistoryService.currentUrl$;

    constructor(public router: Router,
        private routerHistoryService: RouterHistoryService,
        private feedbackService: FeedbackService,
        private searchFormService: SearchFormService,
        private titleManagerService: TitleManagerService,
        private userSettingsManagerService: UserSettingsManagerService,
        private playlistManagerService: PlaylistManagerService,
        private authManagerService: AuthManagerService) {

        super(); // since this is a derived class from BaseComponent

        // Get subscriptions tied in using best practice recommendation for how to unsubscribe, here and
        // below in this component wherever .subscribe is used:
        playlistManagerService.myClips$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            this.myClips = value;
            this.setMyClipsCountMessage();
        });

        playlistManagerService.presentMyClipsExportForm$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            if (value)
                this.openMyExportMyClipsModalForm();
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

        userSettingsManagerService.hideTopicSearch$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            this.hideTopicSearch = value;
        });

        // Certain UI features toggle on/off in this component's html rendering based on settings like "are we in a search form" (advanced search decoration on), etc.
        this.router.events.pipe(takeUntil(this.ngUnsubscribe)).subscribe(event => {
          if (event instanceof NavigationEnd) {

            var inspectedURL: string = event.urlAfterRedirects;

            this.inSearchFormRoute = (inspectedURL.startsWith("/search") || inspectedURL.startsWith("/storyadvs")
                                       || inspectedURL.startsWith("/bioadvs") || inspectedURL.startsWith("/tag")); // NOTE: considering tag/topic search route a search form, too
            if (this.inSearchFormRoute) {
              this.inContentLinksRoute = false;
              this.inShowingManyItemsRoute = false;
            }
            else
            {
              this.inShowingManyItemsRoute = (inspectedURL.startsWith("/all") || inspectedURL.startsWith("/stories/")
                || inspectedURL.startsWith("/storiesForBio"));
              if (this.inShowingManyItemsRoute) {
                this.inContentLinksRoute = false;
              }
              else {
                this.inContentLinksRoute = inspectedURL.startsWith("/contentlinks");
              }
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
        this.hideTopicSearch = this.userSettingsManagerService.currentHideTopicSearch();
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
        // Set the focus away from the Clear button, to the feedback input area.
        // NOTE: this technique is discussed here: https://codeburst.io/focusing-on-form-elements-the-angular-way-e9a78725c04f
        if (this.feedbackInputArea && this.feedbackInputArea.nativeElement)
            this.feedbackInputArea.nativeElement.focus();
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
        setTimeout(() => this.myClipsTitleLengthHelper = "lengthLimitInfoForMyClipsTitle", 0);
    }
    private thinToLegalMyClipsTitleKeyUp() {
        // Purpose: thin out characters just like titledMyClipsAsURL behaves, i.e.,
        // keep only alphanumeric, dash -, comma, single or double quote ' ", underscore _, period . and space, nothing else
        if (this.myClipsTitleCandidate.match(/[^a-zA-Z0-9 \-\,\'\"\_\.]/g))
            this.myClipsTitleCandidate = this.myClipsTitleCandidate.replace(/[^a-zA-Z0-9 \-\,\'\"\_\.]/g, '');
    }
}
