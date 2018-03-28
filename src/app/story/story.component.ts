import { Component, Input, Output, OnInit, ElementRef, EventEmitter, Inject, ViewChild, ChangeDetectorRef} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/Rx";

import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TitleManagerService } from '../title-manager.service';
import { StoryDetailService } from './story-detail.service';
import { PlaylistManagerService } from '../playlist-manager/playlist-manager.service';
import { DetailedStory } from './detailed-story';
import { StorySetType } from '../storyset/storyset-type';

import { GlobalState } from '../app.global-state';
import { AppConfig } from '../config/app-config';
import { TranscriptTiming } from './transcript-timing';
import { VideoMatchLine } from './video-match-line';

import { TimedTextMatch } from './timed-text-match';

import { Playlist } from '../shared/playlist/playlist';

import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';
import { Subscription }   from 'rxjs/Subscription';

@Component({
    selector: 'thmda-story',
    templateUrl: './story.component.html',
    styleUrls: ['./story.component.scss'],
})
export class StoryComponent implements OnInit {
    @ViewChild('myVideoArea') videoPlayerAndControlsAreaRef: ElementRef;
    @ViewChild('myVideoPlayer') videoPlayerRef: any;
    @ViewChild('transcript') transcript: any;

    @Input() transcriptOffset: number;


    transcriptAreaHeight: number = 100;
    wideScreen: boolean = false;
    mobileDetails: boolean = true;

    stories: number[] = GlobalState.myStarredStoriesList;

    myStory: DetailedStory;
    storyDetailsTitle: string;
    storyDetailsShortenedTitle: string;
    storySetType: StorySetType;  // a pass-through value from caller, used in routing out via goBack call
    storyHasMatches: boolean;
    storyIsStarred: boolean;
    storyInPlaylist: boolean;
    interviewDateSuffix: string;

    // Support interfaces for transcript scrolling
    currentActiveTranscriptPiece: number;
    transcriptPieces: string[];
    transcriptHeightInitialized: boolean = false;

    // Support interface for video playbar match ticks
    videoMatches: VideoMatchLine[];
    videoPositionInSeconds: number = 0;
    videoDurationInSeconds: number = 0;

    storiesTextQuery: string = ""; // this query string is for the common-area text search input (TODO: could become a search behavior in refactoring of code if this stays across pages !!!TBD!!!)

    biographyDetailsReady: boolean = false;
    biographyAbstract: string;
    biographyPreferredName: string;
    biographyAccession: string;
    storyCitation: string;

    private autoAdvanceSubscription: Subscription;
    defaultAutoAdvance: boolean;

    // TODO: Depending on storySetType, there are a number of arguments, some optional, needed to allow "goBack" to work cleanly: revisit
    // so that this component's knowledge of what the pass-through values are does not need to be so explicit.  Most (all?) of these arguments
    // as well as goBack() could be deleted if we decide to rely solely on browser navigation and the browser back button rather than give
    // a redundant "go back" button as well in the interface tied to goBack().
    specFromCaller: string; // a pass-through value from caller, used in routing out via goBack call
    queryInterviewYearRangeFromCaller: string; // a pass-through value from caller, used in routing out via goBack call
    IDFromCaller: string; // a pass-through value from caller, used in routing out via goBack call
    queryFromCaller: string; // a pass-through value from caller, used in routing out via goBack call
    queryJustLastNameFromCaller: boolean; // a pass-through value from caller (match just last name field), used in routing out via GoBack call
    queryJustPreferredNameFromCaller: boolean; // a pass-through value from caller (match just preferred name field), used in routing out via GoBack call
    querySortOrderFromCaller: number; // a pass-through value from caller (which field to sort on and how for result set), used in routing out via GoBack call
    queryJustTitleFromCaller: boolean; // a pass-through value from caller (match just title field), used in routing out via GoBack call
    queryJustTranscriptFromCaller: boolean; // a pass-through value from caller (match just transcript field), used in routing out via GoBack call
    queryParentBiographyIDFromCaller: number; // a pass-through value from caller (match stories from just this person), used in routing out via GoBack call
    pgSizeFromCaller: number; // a pass-through value from caller, used in routing out via goBack call
    pgFromCaller: number; // a pass-through value from caller, used in routing out via goBack call
    IDListFromCaller: string; // a pass-through value from caller, used in routing out via goBack call
    reduceToBornThisTimeFromCaller: boolean; // a pass-through value from caller (born this time as in this day or this week instead of a query), used in routing out via GoBack call

    // TODO: we may refactor how match context details are shared; for now just use one object
    myMatchContext: TimedTextMatch[];

    makerCategories = [];
    occupations = [];
    playlist: Playlist[];

    public mobilePopover: boolean = false;
    public mobileTooltipMessage: string;
    private timer: any;
    public myMediaBase: string;

    constructor(private config: AppConfig,
        private _cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService,
        private historyMakerService: HistoryMakerService,
        private storyDetailService: StoryDetailService,
        private playlistManagerService: PlaylistManagerService,
        private userSettingsManagerService: UserSettingsManagerService
    ) {
        this.myMediaBase = this.config.getConfig('mediaBase');
        this.autoAdvanceSubscription = userSettingsManagerService.autoadvanceVideo$.subscribe((value) => {
            this.defaultAutoAdvance = value;
        })
    }

    private computeTranscriptAreaHeight(fullWindowWidth: number, fullWindowHeight: number) {
        // Block out height for other elements aside from transcript area.
        // If those heights not computable yet, use a default.
        // This work influenced by: http://stackoverflow.com/questions/35527559/angular2-get-window-width-onresize
        // !!!TBD!!! TODO: Remove numeric constants here that assume certain positioning and sizing and styling.
        // !!!TBD!!! TODO: Remove the need to bring in ElementRef just so that I could get height of videoPlayerAndControlsAreaRef
        // This is frowned upon but I wanted to get a release out "quickly" for beta testing.
        var blockOutHeight = 344;
        var extrasHeight = 54; // !!!TBD!!! very ugly dependency here, of "knowing" that navbar needs at least 54 pixels, but it gets worse...
        // Also, account for increasing font sizes at larger widths for the navbar, plus we are adding in a header image with height 108 when content width >= 768px
        if (fullWindowWidth >= 600) {
            if (fullWindowWidth >= 960) {
                extrasHeight += 120; // !!!TBD!!! more ugliness, knowing that styles.css saves 174px (120+54) for widths >= 960
                blockOutHeight += 20;
            }
            else if (fullWindowWidth >= 768) {
                extrasHeight += 116; // !!!TBD!!! more ugliness, knowing that styles.css saves 170px (116+54) for widths >= 768 but < 960
                blockOutHeight += 20;
            }
            else {
                extrasHeight += 4; // !!!TBD!!! more ugliness, knowing that styles.css saves 58px (4+54) for widths >= 600 but < 768
                blockOutHeight += 20;
            }
        }
        if (this.videoPlayerAndControlsAreaRef) {
            blockOutHeight = this.videoPlayerAndControlsAreaRef.nativeElement.offsetHeight + 10; // TODO: update when possible to remove need to access nativeElement
        }
        var newTranscriptHeight = fullWindowHeight - blockOutHeight - extrasHeight;

        if (newTranscriptHeight < 100)
            newTranscriptHeight = 100;
        if (this.videoPlayerRef) {
            const aspectRatio = this.videoPlayerRef.api.videogularElement.offsetWidth / this.videoPlayerRef.api.videogularElement.offsetHeight
            if (fullWindowWidth >= 768 && this.wideScreen === false) {
                // Use a bigger calculation when a video has a shorter height (eg. 16:9 ratio)
                if (aspectRatio > 1.4) {
                    this.transcriptAreaHeight = this.videoPlayerRef.api.videogularElement.offsetHeight * 1.5;
                }
                else {
                    if (this.storyHasMatches === true) this.transcriptAreaHeight = this.videoPlayerRef.api.videogularElement.offsetHeight + 30;
                    else this.transcriptAreaHeight = this.videoPlayerRef.api.videogularElement.offsetHeight;
                }
            }
            else if (fullWindowWidth >= 768 && this.wideScreen === true) {
                if (this.storyHasMatches === true) this.transcriptAreaHeight = fullWindowHeight - (this.videoPlayerRef.api.videogularElement.offsetHeight + 120);
                else this.transcriptAreaHeight = fullWindowHeight - (this.videoPlayerRef.api.videogularElement.offsetHeight + 70);
            }
            else {
                if (this.storyHasMatches === true) this.transcriptAreaHeight = fullWindowHeight - (this.videoPlayerRef.api.videogularElement.offsetHeight + 250);
                else this.transcriptAreaHeight = fullWindowHeight - (this.videoPlayerRef.api.videogularElement.offsetHeight + 215);
            }
        }
    }

    onResize(event) {
        this.computeTranscriptAreaHeight(window.innerWidth, window.innerHeight);
        this._cdr.detectChanges(); // running change detection manually
    }

    ngOnInit() {
        this.playlist = this.playlistManagerService.initializePlaylist();
        this.defaultAutoAdvance = this.userSettingsManagerService.currentAutoadvance();
        this.route.params.forEach((params: Params) => {
            this.storyDetailsTitle = "Loading Story Details...";
            this.storyDetailsShortenedTitle = "Loading...";

            // Just in case, clear current interface while next one is loading,
            // e.g., this corrects the bug of clicking a My Playlist item to load a new video:
            this.myStory = null;

            this.storyIsStarred = false;
            this.transcriptPieces = [];
            this.transcriptPieces.push("");

            // Query context might get set via Params on route, which will allow match information to be returned via getStorySpecifics():
            this.queryFromCaller = null;
            this.storyHasMatches = false;
            this.videoMatches = [];
            this.myMatchContext = [];

            this.biographyDetailsReady = false;

            if (params['type'] !== undefined) {
                var goBackStorySetType: StorySetType = +params['type']; // + converts to int, which will work for the StorySetType enum type
                // NOTE: only care about extra optional arguments if they might be used in "go back" which is only attempted
                // if the storySetType is given.  Choose the arguments based on storySetType
                switch (goBackStorySetType) {
                    case StorySetType.GivenIDSet:
                        if (params['IDList'] !== undefined)
                            this.IDListFromCaller = params['IDList'];
                        break;
                    case StorySetType.BiographyCollection:
                        if (params['cID'] !== undefined) {
                            this.IDFromCaller = params['cID'];
                            if (params['pspec'] !== undefined)
                                this.specFromCaller = params['pspec'];
                            if (params['ppgS'] !== undefined) {
                                var givenPageSize = +params['ppgS'];
                                if (givenPageSize != null && givenPageSize > 0)
                                    this.pgSizeFromCaller = givenPageSize;
                            }
                            if (params['ppg'] !== undefined) {
                                var givenPageIndicator = +params['ppg'];
                                if (givenPageIndicator != null && givenPageIndicator > 0)
                                    this.pgFromCaller = givenPageIndicator; // 1-based indicator used, so first page is at page 1
                            }
                            if (params['sT'] !== undefined)
                                this.queryJustTitleFromCaller = (params['sT'] == "1");
                            else
                                this.queryJustTitleFromCaller = null;
                            if (params['sS'] !== undefined)
                                this.queryJustTranscriptFromCaller = (params['sS'] == "1");
                            else
                                this.queryJustTranscriptFromCaller = null;
                            if (params['ip'] !== undefined && !isNaN(+params['ip']))
                                this.queryParentBiographyIDFromCaller = +params['ip'];
                            if (params['bt'] !== undefined)
                                this.reduceToBornThisTimeFromCaller = (params['bt'] == "1");
                            else
                                this.reduceToBornThisTimeFromCaller = null;
                            if (params['ln'] !== undefined)
                                this.queryJustLastNameFromCaller = (params['ln'] == "1");
                            else
                                this.queryJustLastNameFromCaller = null;
                            if (params['pn'] !== undefined)
                                this.queryJustPreferredNameFromCaller = (params['pn'] == "1");
                            else
                                this.queryJustPreferredNameFromCaller = null;
                            if (params['so'] !== undefined && !isNaN(+params['so']))
                                this.querySortOrderFromCaller = +params['so'];
                            else
                                this.querySortOrderFromCaller = null;
                            if (params['q'] !== undefined)
                                this.queryFromCaller = params['q'];
                        }
                        else {
                            // Give up going back because we need an ID, too:
                            goBackStorySetType = null;
                        }
                        break;
                    case StorySetType.TextSearch:
                        if (params['q'] !== undefined) {
                            this.queryFromCaller = params['q'];
                            if (params['sT'] !== undefined)
                                this.queryJustTitleFromCaller = (params['sT'] == "1");
                            else
                                this.queryJustTitleFromCaller = null;
                            if (params['sS'] !== undefined)
                                this.queryJustTranscriptFromCaller = (params['sS'] == "1");
                            else
                                this.queryJustTranscriptFromCaller = null;
                            if (params['iy'] !== undefined)
                                this.queryInterviewYearRangeFromCaller = params['iy'];
                            if (params['ip'] !== undefined && !isNaN(+params['ip']))
                                this.queryParentBiographyIDFromCaller = +params['ip'];
                            if (params['pgS'] !== undefined) {
                                var givenPageSize = +params['pgS'];
                                if (givenPageSize != null && givenPageSize > 0)
                                    this.pgSizeFromCaller = givenPageSize;
                            }
                            if (params['pg'] !== undefined) {
                                var givenPageIndicator = +params['pg'];
                                if (givenPageIndicator != null && givenPageIndicator > 0)
                                    this.pgFromCaller = givenPageIndicator; // 1-based indicator used, so first page is at page 1
                            }
                            if (params['spec'] !== undefined)
                                this.specFromCaller = params['spec'];
                        }
                        else {
                            // Give up going back because we need a query "q" parameter, too:
                            goBackStorySetType = null;
                        }
                        break;
                }
                this.storySetType = goBackStorySetType; // this might have been reset to null if parameter chain did not make sense
            }
            else {
                this.storySetType = null;
            }
            var myStoryID: number = +params['ID']; // + prefix converts string into a number
            this.storyDetailService.getStorySpecifics(myStoryID, this.queryFromCaller)
                .then(storyDetails => {
                    this.transcriptHeightInitialized = false;
                    this.storyDetailsTitle = storyDetails.title;
                    this.storyDetailsShortenedTitle = this.truncateAsNeeded(storyDetails.title);

                    this.biographyAbstract = storyDetails.citation.descriptionShort;
                    this.biographyAccession = storyDetails.citation.accession;
                    this.biographyPreferredName = storyDetails.citation.preferredName;
                    this.biographyDetailsReady = true;

                    // TODO: decide whether to try to disable built-in player controls, accessible in
                    // some browsers via right-click on video player area for example, or leave them there.
                    // if (this.videoPlayerRef && this.videoPlayerRef.canPlayType) {
                    //    // remove the default video playback controls as we add our own
                    //    this.videoPlayerRef.removeAttribute("controls");
                    // }
                    this.videoPositionInSeconds = 0;
                    this.videoDurationInSeconds = storyDetails.duration / 1000; // could be a fraction, of course

                    this.myStory = storyDetails;

                    this.currentActiveTranscriptPiece = -1;
                    // Populating this.transcriptPieces is done AFTER match text is marked up in transcript;
                    // see ComputeTimedTranscriptWithMatches().

                    if (storyDetails != null) {
                        this.titleManagerService.setTitle("Details, " + storyDetails.title);

                        // Update it as a "starred" story if it is so marked by being in the favorites set:
                        // this.storyIsStarred = (GlobalState.myStarredStoriesList.findIndex(x => x == storyDetails.storyID) >= 0);
                        this.storyInPlaylist = (this.playlist.findIndex(x => x.storyID == this.myStory.storyID) >=0 );

                        this.storyCitation = this.ComposedCitationForStory(storyDetails.citation.preferredName, storyDetails.citation.accession,
                            storyDetails.citation.interviewer, storyDetails.citation.interviewDate, storyDetails.citation.sessionOrder, storyDetails.citation.tapeOrder,
                            storyDetails.storyOrder, storyDetails.title);

                        storyDetails.makerCategories.forEach(element => {
                            let category = this.historyMakerService.getMaker(Number(element));
                            this.makerCategories.push(category);
                        });

                        this.occupations = storyDetails.occupations;

                        this.interviewDateSuffix = ", interviewed " + GlobalState.cleanedMonthDayYear(storyDetails.citation.interviewDate);

                        // Do more work to connect timed text offsets (e.g., transcript offsets)
                        // with video time, which will then be stored in this.myMatchContext for fast access during video play.
                        // If there are no matches, ComputeTimesForOffsets, DecorateVideoPlaybarWithMatches, and
                        // ComputeTimedTranscriptWithMatches all do the right thing and hide nonexistent match details.
                        this.ComputeTimesForOffsets(); // will populate this.myMatchContext
                        this.DecorateVideoPlaybarWithMatches(); // show any match time offsets on play bar
                        this.ComputeTimedTranscriptWithMatches(); // after matches loaded, dress up transcript
                    }
                    else {
                        this.titleManagerService.setTitle("The ScienceMakers - No Story Details Found");
                        this.storyCitation = null;
                    }
                })
                .catch(reason => { // TODO: decide how specific to make error recovery, i.e., do one thing for ERR_NAME_NOT_RESOLVED
                    // which would need to get propagated out of handleError earlier, something different for other errors.
                    // Right now this "network timeout" message could be a lie!!! !!!TBD!!!
                    this.myStory = null;
                    this.interviewDateSuffix = null;
                    this.storyDetailsTitle = "Loading story details experienced a network timeout -- try again in a few minutes.";
                    this.storyDetailsShortenedTitle = this.storyDetailsTitle; // NOTE: with myStory == null there will be more display space for this long "shortened" title
                    this.titleManagerService.setTitle("The ScienceMakers - No Story Details Found");
                    this.storyCitation = null;
                });
        });

    }

    public initTranscriptHeight() {
        this.computeTranscriptAreaHeight(window.innerWidth, window.innerHeight);
    }

    // Return the given string, unless it is too long, then return a shortened form ended with ...
    private truncateAsNeeded(givenString: string): string {
        var validatedString: string = givenString;
        const MAX_ALLOWABLE_LENGTH = 68;
        if (validatedString != null && validatedString.length > MAX_ALLOWABLE_LENGTH) {
            var lastIndex = givenString.lastIndexOf(' ', MAX_ALLOWABLE_LENGTH - 3);
            if (lastIndex < 0)
                // Could not find a space to break on, so just keep first MAX_ALLOWABLE_LENGTH - 3 characters
                lastIndex = MAX_ALLOWABLE_LENGTH - 2;
            validatedString = givenString.substring(0, lastIndex) + "...";
        }
        return validatedString;
    }

    private ComposedCitationForStory(bioPreferredName: string, bioAccessionNumber: string, interviewer: string, interviewDate: string,
        sessionNumber: number, tapeNumber: number, storyNumber: number, storyTitle: string): string {
        var citation: string = "";

        // NOTE: format for citation is:
        // Biography preferred name (The HistoryMakers accession_name), interviewed by ___, interview date,
        // The HistoryMakers Digital Archive. Session #, tape #, story #, story title.
        // Example:
        // Eddie Jenkins, Jr. (The HistoryMakers A2007.068), interviewed by Larry Crowe, February 14, 2007,
        // The HistoryMakers Digital Archive. Session 1, tape 4, story 9, Eddie Jenkins, Jr.
        // recalls the early days of weight training in the NFL.

        citation = bioPreferredName + " (The HistoryMakers " + bioAccessionNumber + "), interviewed by " + interviewer + ", " +
            GlobalState.cleanedMonthDayYear(interviewDate) + ", The HistoryMakers Digital Archive. Session " +
            sessionNumber + ", tape " + tapeNumber + ", story " + storyNumber + ", " + storyTitle;
        return citation;
    }

    // Helper function to show match time offsets on a play bar by initializing this.videoMatches
    private DecorateVideoPlaybarWithMatches() {
        // Based on match information, compute this.videoMatches
        var lastMatchTimeProcessed: number = -1;
        var matchLine: VideoMatchLine;
        var percentValue: number;

        for (var iMatch: number = 0; iMatch < this.myMatchContext.length; iMatch++) {
            if (this.myMatchContext[iMatch].time > lastMatchTimeProcessed) {
                lastMatchTimeProcessed = this.myMatchContext[iMatch].time;
                matchLine = new VideoMatchLine();
                matchLine.time = lastMatchTimeProcessed;
                // NOTE: time is in milliseconds in this.myMatchContext; but videoDuration is in seconds
                // The integral percentage (i.e., 50 is halfway) based on milliseconds for time T,
                // duration D is (T * 100) / (D * 1000) which we simplify to T / (D * 10)
                percentValue = lastMatchTimeProcessed / (this.videoDurationInSeconds * 10);
                percentValue = Math.floor(percentValue);
                if (percentValue < 0)
                    percentValue = 0;
                else if (percentValue > 100)
                    percentValue = 100;
                matchLine.percentOffset = percentValue;
                this.videoMatches.push(matchLine);
            }
        }
    }

    // Helper function to bold match text in the transcript, and break transcript up into pieces to
    // highlight a piece based on video transcript timing.  If there are no matches, then no text will get bolded.
    private ComputeTimedTranscriptWithMatches() {
        var matchOffset: number;
        var matchEndOffset: number;
        var textWithBoldedMatches: string;
        var outOfBoundsOffset: number;
        var timingIndexToCheckFirst: number;

        if (this.myStory.transcript == null || this.myStory.transcript.length == 0) {
            this.transcriptPieces = [];
            this.transcriptPieces.push("");
            return; // give up if there is no transcript
        }

        // NOTE: assumes this.myStory.timing.length >= 1

        // Pass 1: for every match BLAH, add in <b> and </b> markers around BLAH in transcript text.
        // As such inserts are done, update the offset numbers in this.myStory.timingPairs.  The plain transcript
        // will transform into textWithBoldedMatches.
        // Pass 2: use this.myStory.timing to break textWithBoldedMatches (i.e., the transcript with matches)
        // into this.transcriptPieces.

        // Pass 1: walk the matches from last one (greatest offset into transcript) to first...
        // Once a match is processed, never consider those characters again, i.e., even if match offsets
        // and scoring words somehow overlap/intermingle, the logic here will never allow for a case like
        // <b>ok here <b>bad, bold in bold</b></b> because the ending </b> of match N will never be placed
        // after the start <b> of match N+1.
        outOfBoundsOffset = this.myStory.transcript.length; // index transcriptText.length out of bounds (index transcriptText.length-1 still valid for length >= 1)
        textWithBoldedMatches = "";
        timingIndexToCheckFirst = this.myStory.timingPairs.length - 1; // working from end of transcript back to front, so start with last timing entry
        for (var iMatch: number = this.myMatchContext.length - 1; iMatch >= 0; iMatch--) {
            matchOffset = this.myMatchContext[iMatch].startOffset;
            matchEndOffset = this.myMatchContext[iMatch].endOffset;
            if (matchOffset < outOfBoundsOffset) { // there is room in text to highlight this match
                // NOTE: matchEndOffset might be one past the end of transcriptText, which is
                // ok for using it with transcriptText.substring(matchOffset, endingOffset):

                // TODO: The following sort of string appending construction may be time-consuming - re-implement later once the means
                // of transcript contruction with timing has been formalized (e.g., it may be replaced or augmented with closed-captioning).

                // We now have processed transcript from original offset matchOffset to its end.
                // We insert 3 characters at matchOffset and 4 more at matchEndOffset.
                if (matchEndOffset < outOfBoundsOffset) {
                    textWithBoldedMatches = "<b>" +
                        this.myStory.transcript.substring(matchOffset, matchEndOffset) + "</b>" +
                        this.myStory.transcript.substring(matchEndOffset, outOfBoundsOffset) + textWithBoldedMatches;
                }
                else { // the match extends to the end of this chunk being considered.
                    textWithBoldedMatches = "<b>" +
                        this.myStory.transcript.substring(matchOffset, matchEndOffset) + "</b>" + textWithBoldedMatches;
                }
                outOfBoundsOffset = matchOffset; // from match forward, no longer process (to avoid any overlapping issues)
                while (this.myStory.timingPairs[timingIndexToCheckFirst].offset >= matchOffset && timingIndexToCheckFirst > 0) {
                    timingIndexToCheckFirst--; // determine max number of timing entries to be checked for update based on <b>,</b> inserts
                }
                for (var iTiming = timingIndexToCheckFirst; iTiming < this.myStory.timingPairs.length; iTiming++) {
                    if (this.myStory.timingPairs[iTiming].offset > matchOffset) {
                        // Grow offset by 3 for <b> and perhaps an additional 4 for </b>
                        if (this.myStory.timingPairs[iTiming].offset >= matchEndOffset)
                            this.myStory.timingPairs[iTiming].offset += 7;
                        else
                            this.myStory.timingPairs[iTiming].offset += 3;
                    }
                    // else no offset adjustment needed for time entries at or before the matchOffset insert; e.g.,
                    // if match at "snow" and now we have <b>snow</b> keep timing offset pointed to start of <b>
                }
            }
        }
        if (this.myMatchContext.length > 0) {
            // Transcript from outOfBoundsOffset to end already processed.  Tack on any text
            // that precedes the first match.
            if (outOfBoundsOffset > 0)
                textWithBoldedMatches = this.myStory.transcript.substring(0, outOfBoundsOffset) + textWithBoldedMatches;
        }
        else {
            // With no matches, this.myStory.timingPairs[] is unchanged and textWithBoldedMatches == transcriptText
            textWithBoldedMatches = this.myStory.transcript;
        }

        // NOTE: at this point there has been no replacement of <br> for \n in textWithBoldedMatches, to simplify all the offset adjustments.
        // Do the replacement as chunks of transcript are moved intothis.transcriptPieces.
        this.transcriptPieces = [];
        var transcriptPiece: string;
        var re = /\n/g;

        // Pass 2: use the adjusted this.myStory.timingPairs (to account for <b></b> inserts) to break
        // textWithBoldedMatches(i.e., the transcript with matches) into this.transcriptPieces.
        if (this.myStory.timingPairs.length > 1) {
            // Fill transcript by breaking it into N pieces, corresponding to the N timing pieces.

            for (var i = 0; i < this.myStory.timingPairs.length - 1; i++) {
                if (this.myStory.timingPairs[i + 1].offset > this.myStory.timingPairs[i].offset) {
                    // Something worthwhile for this piece.
                    transcriptPiece = textWithBoldedMatches.substring(this.myStory.timingPairs[i].offset,
                            this.myStory.timingPairs[i + 1].offset)
                    transcriptPiece = transcriptPiece.replace(re,'<br>');
                    this.transcriptPieces.push(transcriptPiece);
                }
                else
                    // Empty string for this timing entry (ideally bogus timing entry would not even be there ever)
                    this.transcriptPieces.push("");
            }
        }
        else {
            // No timing (or just one entry), so have all of transcript text be in one piece,
            // and do not make it active (keep active indicator == -1).
            transcriptPiece = textWithBoldedMatches.replace(re,'<br>');
            this.transcriptPieces.push(transcriptPiece);
        }
    }

    advanceTranscript(offset) {
        if (offset > 18) this.transcript.nativeElement.scrollTop = offset - 22;
    }

    autoAdvanceToNext() {
        // If the user setting to "autoadvance" is true, and there is a next story, automatically advance to it:
        if (this.defaultAutoAdvance) {
            if (this.myStory.nextStory != null && this.myStory.nextStory > 0) {
                this.gotoNewStory(this.myStory.nextStory);
            }
        }
    }

    gotoPrevStory() {
        if (this.myStory != null) {
            this.gotoNewStory(this.myStory.prevStory);
        }
    }

    gotoNextStory() {
        if (this.myStory != null) {
            this.gotoNewStory(this.myStory.nextStory);
        }
    }

    gotoPrevMatch() {
        // Go to the previous match before the given play time (or first match if no matches are before).
        var movieTimeInMSecs: number = this.videoPositionInSeconds * 1000;
        var matchIndexToSeekTo: number = this.myMatchContext.length - 1;
        for (var i = 0; i < this.myMatchContext.length; i++) {
            if (this.myMatchContext[i].time >= movieTimeInMSecs) {
                if (i == 0)
                    matchIndexToSeekTo = 0; // can't move earlier than first match
                else
                    matchIndexToSeekTo = i - 1;
                break;
            }
        }
        if (matchIndexToSeekTo >= 0) {
            var timeInSecs = this.myMatchContext[matchIndexToSeekTo].time / 1000; // convert milliseconds to seconds
            this.setPosition(timeInSecs);
        }
    }

    gotoNextMatch() {
        // Go to the next match after the given play time (or last match if no matches are after).
        var movieTimeInMSecs: number = this.videoPositionInSeconds * 1000;
        var matchIndexToSeekTo: number = 0;
        var lastMatchIndex: number = this.myMatchContext.length - 1;
        for (var i = lastMatchIndex; i >= 0; i--) {
            if (this.myMatchContext[i].time <= movieTimeInMSecs) {
                if (i == lastMatchIndex)
                    matchIndexToSeekTo = lastMatchIndex; // can't move later than last match
                else
                    matchIndexToSeekTo = i + 1;
                break;
            }
        }
        if (lastMatchIndex >= 0) {
            var timeInSecs = this.myMatchContext[matchIndexToSeekTo].time / 1000; // convert milliseconds to seconds
            this.setPosition(timeInSecs);
        }
    }

    setPosition(newValInSecs: number) {
        if (this.videoPlayerRef) {
            if (this.videoPositionInSeconds != newValInSecs) {
                if (newValInSecs >= 0 && newValInSecs <= this.videoDurationInSeconds) {
                    this.videoPositionInSeconds = newValInSecs;
                    this.videoPlayerRef.setCurrentTime(newValInSecs);
                }
            }
        }
    }

    gotoNewStory(givenNewStoryID: number) {
        if (givenNewStoryID != 0) { // there is a non-zero ID to navigate to: go there, bypassing sending additional routing details that we
            // collected in ngOnInit because we are NOT checking for match information/context for prev/next story chain.
            // These prev/next stories get loaded as if they came from NO query context at first (see ngOnInit()) but then if a
            // story is shown to come from a text search context, that context is established.

            // Clear current interface while next one is loading:
            this.storyDetailsTitle = ""; // NOTE: the informative "Loading..." that might show up 1/100 of time is probably worse than having 99/100 with no "flash" of text; choosing latter no-text...
            this.storyDetailsShortenedTitle = "";
            this.myStory = null;

            this.router.navigate(['/story', givenNewStoryID]);
        }
    }

    isTranscriptPieceActive(whichPiece: number) { return (whichPiece == this.currentActiveTranscriptPiece); }

    adjustVideoCurrentTime(movieTimeInSecs: number) {

        // One-time setup of video transcript height based on video player (and player controls) height:
        if (!this.transcriptHeightInitialized) {
          this.computeTranscriptAreaHeight(window.innerWidth, window.innerHeight);
          this.transcriptHeightInitialized = true;
        }

        this.videoPositionInSeconds = movieTimeInSecs;
        // Possibly adjust which transcript piece is highlighted as well.
        var maxTimingEntries: number = 0;

        if (this.myStory && this.myStory.timingPairs)
            maxTimingEntries = this.myStory.timingPairs.length;

        if (maxTimingEntries > 1) {
            // Only bother with selecting a piece of the transcript if there are 2+ pieces.
            // The means of activating a piece is via this.currentActiveTranscriptPiece.
            // NOTE: max value for this.currentActiveTranscriptPiece == maxTimingEntries - 2 under assumption
            // that final timing entry in this.myStory.timingPairs equals transcript length as offset, video duration as timing, i.e.,
            // that last entry does not help set an active region by itself but sets maximums on offset and video timing.
            // This assumption allows us to safely make use of this.currentActiveTranscriptPiece + 1 as an index into this.myStory.timingPairs.
            var movieTimeInMSecs: number = movieTimeInSecs * 1000;
            if (this.currentActiveTranscriptPiece < 0 ||
                movieTimeInMSecs < this.myStory.timingPairs[this.currentActiveTranscriptPiece].time ||
                movieTimeInMSecs > this.myStory.timingPairs[this.currentActiveTranscriptPiece + 1].time) {
                // There will be a change to this.currentActiveTranscriptPiece based on movieTimeInMSecs
                if (movieTimeInMSecs < this.myStory.timingPairs[1].time)
                    this.currentActiveTranscriptPiece = 0;
                else if (movieTimeInMSecs >= this.myStory.timingPairs[maxTimingEntries - 2].time)
                    this.currentActiveTranscriptPiece = maxTimingEntries - 2;
                else {
                    for (var i: number = 1; i < maxTimingEntries - 1; i++)
                        if (movieTimeInMSecs < this.myStory.timingPairs[i + 1].time) {
                            this.currentActiveTranscriptPiece = i;
                            break;
                        }
                }
            }
        }
    }

    private ComputeTimesForOffsets() {
        // Use this.myStory.timingPairs and this.myStory.matchTerms to compute this.myMatchContext for each match in matchTerms
        var i: number = 0;
        var matchIndex: number = 0;
        var maxTimingPairIndex: number;
        var givenMatchesCount: number;
        var newEntry: TimedTextMatch;

        if (this.myStory.timingPairs == null)
            maxTimingPairIndex = -1;
        else
            maxTimingPairIndex = this.myStory.timingPairs.length - 1;
        if (this.myStory.matchTerms == null)
            givenMatchesCount = 0;
        else
            givenMatchesCount = this.myStory.matchTerms.length;

        if (givenMatchesCount == 0 || maxTimingPairIndex <= 0) {
            this.storyHasMatches = false;
            this.myMatchContext = [];
            return;
        }

        this.storyHasMatches = true;
        // As we move through this.myStory.timingPairs in ascending offset order, we don't go back,
        // i.e., i starts at 0 but moves forward within this outer while loop rather than being
        // reset to 0 each time:
        while (matchIndex < givenMatchesCount) {
            while (this.myStory.timingPairs[i].offset <= this.myStory.matchTerms[matchIndex].startOffset &&
                i <= maxTimingPairIndex)
                i++;
            // Offset at matchIndex lines up in time slot at i-1 (using 0 if i-1 == -1);
            // set the time attribute for matchInfo[] based on the stored offset value already there,
            // adjusting the time based on this.myStory.timingPairs.
            newEntry = new TimedTextMatch();
            newEntry.startOffset = this.myStory.matchTerms[matchIndex].startOffset;
            newEntry.endOffset = this.myStory.matchTerms[matchIndex].endOffset;

            if (i == 0)
                newEntry.time = this.myStory.timingPairs[0].time;
            else
                newEntry.time = this.myStory.timingPairs[i - 1].time;
            this.myMatchContext.push(newEntry);
            matchIndex++; // Note: service puts matches in order, so this.myStory.timingPairs[N+1].startOffset >= this.myStory.timingPairs[N].startOffset
        }
    }

    convertToMMSS(givenVal: number): string {
        return GlobalState.convertToMMSS(givenVal);
    }

    toggleAddToPlaylist() {
        this.playlistManagerService.toggleAddToPlaylist(this.myStory);
        this.storyInPlaylist = (this.playlist.findIndex(x => x.storyID == this.myStory.storyID) >=0 );
        this.toggleToolTip();
    }

    // This custom tooltip implementation is a temporary workaround
    // until ngx-bootstrap releases a fix for this issue: https://github.com/valor-software/ngx-bootstrap/issues/2257
    toggleToolTip() {
        this.storyInPlaylist ? this.mobileTooltipMessage = "Added to Playlist" : this.mobileTooltipMessage = "Removed from Playlist";
        this.mobilePopover = true;
        clearTimeout(this.timer);
        this.timer = setTimeout(()=>{ this.mobilePopover = false; },2000);
    }

    goBack() {
        if (this.storySetType != null && this.myStory != null) {
            // Pass along the specific story story ID so that the storyset component can select that story.
            var myStoryID: number = this.myStory.storyID;
            var optionalArgs = {};

            // Optionally, pass along other information based on storySetType.
            // The storySetType is critical for getting back to the correct type of storyset:
            switch (this.storySetType) {
                case StorySetType.GivenIDSet:
                    optionalArgs['sID'] = myStoryID;
                    if (this.IDListFromCaller != null)
                        optionalArgs['IDList'] = this.IDListFromCaller;
                    this.router.navigate(['/stories', this.storySetType, optionalArgs]);
                    break;
                case StorySetType.BiographyCollection: // by code in opening route processing, this.IDFromCaller is populated
                    if (this.IDFromCaller != null) {
                        optionalArgs['ID'] = this.IDFromCaller;
                        optionalArgs['sID'] = myStoryID;
                        if (this.specFromCaller != null)
                            optionalArgs['pspec'] = this.specFromCaller;
                        if (this.pgSizeFromCaller != null)
                            optionalArgs['ppgS'] = this.pgSizeFromCaller;
                        if (this.pgFromCaller != null)
                            optionalArgs['ppg'] = this.pgFromCaller;
                        if (this.reduceToBornThisTimeFromCaller != null) {
                            if (this.reduceToBornThisTimeFromCaller)
                                optionalArgs['bt'] = "1";
                            else
                                optionalArgs['bt'] = "0";
                        }
                        if (this.queryJustLastNameFromCaller != null) {
                            if (this.queryJustLastNameFromCaller)
                                optionalArgs['ln'] = "1";
                            else
                                optionalArgs['ln'] = "0";
                        }
                        if (this.queryJustPreferredNameFromCaller != null) {
                            if (this.queryJustPreferredNameFromCaller)
                                optionalArgs['pn'] = "1";
                            else
                                optionalArgs['pn'] = "0";
                        }
                        if (this.querySortOrderFromCaller != null)
                            optionalArgs['so'] = this.querySortOrderFromCaller;
                        if (this.queryFromCaller != null)
                            optionalArgs['q'] = GlobalState.cleanedRouterParameter(this.queryFromCaller);
                        this.router.navigate(['/storiesForBio', optionalArgs]);
                    }
                    else
                        // Give up going back because we need an ID, too; just go home
                        this.router.navigate(['/home']);
                    break;
                case StorySetType.TextSearch:
                    if (this.queryFromCaller != null) {
                        optionalArgs['q'] = GlobalState.cleanedRouterParameter(this.queryFromCaller);
                        if (this.queryJustTitleFromCaller != null) {
                            if (this.queryJustTitleFromCaller)
                                optionalArgs['sT'] = "1";
                            else
                                optionalArgs['sT'] = "0";
                        }
                        if (this.queryJustTranscriptFromCaller != null) {
                            if (this.queryJustTranscriptFromCaller)
                                optionalArgs['sS'] = "1";
                            else
                                optionalArgs['sS'] = "0";
                        }
                        if (this.queryParentBiographyIDFromCaller != null)
                            optionalArgs['ip'] = this.queryParentBiographyIDFromCaller;

                        optionalArgs['sID'] = myStoryID;
                        if (this.specFromCaller != null)
                            optionalArgs['spec'] = this.specFromCaller;
                        if (this.pgSizeFromCaller != null)
                            optionalArgs['pgS'] = this.pgSizeFromCaller;
                        if (this.pgFromCaller != null)
                            optionalArgs['pg'] = this.pgFromCaller;
                        if (this.queryInterviewYearRangeFromCaller != null)
                            optionalArgs['iy'] = this.queryInterviewYearRangeFromCaller;
                        this.router.navigate(['/stories', this.storySetType, optionalArgs]);
                    }
                    else
                        // Give up going back because we need a query, too; just go home
                        this.router.navigate(['/home']);
                    break;
                case StorySetType.StarredSet: // NOTE: "favorites" set is cached in globals so no preservation of IDList is attempted here
                    optionalArgs['sID'] = myStoryID;
                    this.router.navigate(['/stories', this.storySetType, optionalArgs]);
                    break;
                case StorySetType.StarredSetWithGivenIDs:
                  // NOTE: "favorites" set may have been specified with IDList, but rather than allow "My Playlist" to be set via router,
                  // keep whatever is in the global state for "favorites" (e.g., perhaps user removed this story from My Playlist so it should not
                  // come back into the starred set or favorites set via a router listing in IDList arguments).
                    optionalArgs['sID'] = myStoryID;
                    // NOTE: notice change in route to StorySetType.StarredSet to signal use of favorites starred set cache.
                    this.router.navigate(['/stories', StorySetType.StarredSet, optionalArgs]);
                    break;
            }
        }
        else {
            // If this page does not indicate a storyset predecessor via routing parameters when first loaded (and then
            // cached into this.storySetType), give up and go home.
            this.router.navigate(['/home']);
        }
    }

    // (TODO: Code below could become a search behavior in refactoring of code if this stays across pages !!!TBD!!!:
    // this.storiesTextQuery. doStorySearch() and noNeedForStorySearch().)
    doStorySearch() {
        // Accumulate routing parameters specifying filter specification, page information, etc.
        if (this.storiesTextQuery != null && this.storiesTextQuery.length > 0) {
            // Proceed with route parameter computations and doing the search.
            var moreOptions = [];

            moreOptions['q'] = GlobalState.cleanedRouterParameter(this.storiesTextQuery);
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            this.router.navigate(['/stories', StorySetType.TextSearch, moreOptions]);
        }
    }

    noNeedForStorySearch(): boolean { // Returns true iff there is no need for search action (i.e., no search query).
        return (this.storiesTextQuery == null || this.storiesTextQuery.length == 0);
    }

    isWideScreen() {
        this.wideScreen === true ? this.wideScreen = false : this.wideScreen = true;
    }
}
