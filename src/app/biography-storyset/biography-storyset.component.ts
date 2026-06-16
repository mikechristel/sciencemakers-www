// 2026 NOTE with Angular 21 update and especially update of Grid/List/Map to a radiogroup for accessibility improvement:
// instead of two booleans, cardView and textView, now have one viewStateSignal that is one of AsGrid, AsList, AsMap.

import { Component, OnInit, ElementRef, inject, viewChild, ChangeDetectorRef, signal } from '@angular/core';
import { takeUntil } from "rxjs/operators";

import { ActivatedRoute, Router, Params } from '@angular/router';
import { BiographyStorySetService } from './biography-storyset.service';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TextSearchService } from '../text-search/text-search.service';
import { TitleManagerService } from '../shared/title-manager.service';
import { SearchFormService } from '../shared/search-form/search-form.service';

import { StoryDocument} from '../storyset/story-document';
import { GlobalState, ViewState, Nullable } from '../app.global-state';
import { environment } from '../../environments/environment';

import { DetailedBiographyStorySet } from './detailed-biography-storyset';
import { BiographyFavorites } from '../story/biography-favorites';

import { SearchFormOptions } from '../shared/search-form/search-form-options';
import { BaseComponent } from '../shared/base.component';
import { USMapDistribution } from '../US-map/US-map-distribution';
import { SearchResult } from '../storyset/search-result';
import { USMapManagerService } from '../US-map/US-map-manager.service';
import { WindowService } from '../shared/services/window.service';
import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { NgClass } from '@angular/common';
import { FocusMeDirective } from '../shared/focus-me.directive';
import { MyPanelComponent } from '../shared/my-panel/my-panel.component';
import { StoryStampComponent } from '../story-stamp/story-stamp.component';
import { USMapComponent } from '../US-map/US-map.component';
import { SearchFormComponent } from '../shared/search-form/search-form.component'; // used to read changes to set title

@Component({
    selector: 'my-bio-storyset',
    templateUrl: './biography-storyset.component.html',
    styleUrls: ['./biography-storyset.component.scss'],
    imports: [FocusMeDirective, MyPanelComponent, NgClass, StoryStampComponent, USMapComponent, SearchFormComponent]
})
export class BiographyStorySetComponent extends BaseComponent implements OnInit {
    
    // Assign enum ViewState to a property to make it accessible in the html template (e.g., to use AsGrid, AsText, AsMap instead of 1, 2, 3 in the html)
    protected readonly MyViewState = ViewState;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private globalState = inject(GlobalState);
    private biographyStorySetService = inject(BiographyStorySetService);
    private historyMakerService = inject(HistoryMakerService);
    private textSearchService = inject(TextSearchService);
    private titleManagerService = inject(TitleManagerService);
    private myUSMapManagerService = inject(USMapManagerService);
    private windowService = inject(WindowService);
    private userSettingsManagerService = inject(UserSettingsManagerService);
    private searchFormService = inject(SearchFormService);
    private liveAnnouncer = inject(LiveAnnouncer);

    private changeDetectorRef = inject(ChangeDetectorRef);

    readonly radioGroup1_Map = viewChild<ElementRef>('rg1Map');
    readonly radioGroup1_Text = viewChild<ElementRef>('rg1Text');
    readonly radioGroup1_Pic = viewChild<ElementRef>('rg1Pic');
    readonly radioGroup2_Map = viewChild<ElementRef>('rg2Map');
    readonly radioGroup2_Text = viewChild<ElementRef>('rg2Text');
    readonly radioGroup2_Pic = viewChild<ElementRef>('rg2Pic');

    signalFocusToTitle: boolean = false; // is used in html rendering of this component
    signalFocusToStoryID: number = -1; // ID of the story, if any, that is selected in the story list (starts as -1 == this.globalState.NOTHING_CHOSEN)

    myAccession: string = ""; // the biography accession ID for this story set, expected as a route parameter; used in service calls to get the story set information
    titleForEmptyStorySet: Nullable<string> = null; // only used for bogus parameter(s) resulting in empty data
    titleForCompletedStorySet: Nullable<string> = null; // one of this or titleForEmptyStorySet used for route's h1 element and html title

    isNonemptyContent: boolean = false;
    toggleDetailsLabel: string = "";
    tapeSummariesShown: boolean = false;
    bioDetailOpened: boolean = false;
    bioDescriptionOpened: boolean = false;

    tapeTitlesCache: string[] = []; // At client request, title the tape "chunk" in a particular way when tapeSummariesShown
    tapeSummariesCache: string[] = [];
    myStoryListByTape: StoryDocument[][] = [];
    myStoryList: StoryDocument[] = [];
    bioSessionDetails: string[] = [];

    USStateDistribution:  Nullable<USMapDistribution> = null;

    bioDetail: Nullable<DetailedBiographyStorySet> = null; // holds the detailed information about the biography and its story set
    tailoredJobFamilyList: Nullable<string> = null;
    tailoredOccupationList: Nullable<string> = null;
    tailoredMakerGroupList: Nullable<string> = null;
    tailoredBirthDate: Nullable<string> = null;
    tailoredBirthLocation: Nullable<string> = null;
    tailoredDeceasedDate: Nullable<string> = null;
    tailoredImage: Nullable<string> = null;
    tailoredStorySummationNarrow: Nullable<string> = null;
    tailoredStorySummationWide: Nullable<string> = null;
    biographyFavoriteColor: Nullable<string> = null;
    biographyFavoriteFood: Nullable<string> = null;
    biographyFavoriteTimeOfYear: Nullable<string> = null;
    biographyFavoriteVacationSpot: Nullable<string> = null;
    biographyFavoriteQuote: Nullable<string> = null;

    viewStateSignal = signal<ViewState>(ViewState.AsGrid); // defaults to grid view; never is undefined (all view states mean something)

    private myMediaBase: string;

    constructor() {

        super();  // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)
        const myUSMapManagerService = this.myUSMapManagerService;

        // Start off with an empty signal about what to focus on
        this.clearSignalsForCurrentFocusSetting();

        this.myMediaBase = environment.mediaBase;

        myUSMapManagerService.clickedRegionID$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            this.filterOnUSMapRegion(value, false);
            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });

        myUSMapManagerService.regionIDToClear$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
            this.filterOnUSMapRegion(value, true);
            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });

        this.searchFormService.setSearchOptions(new SearchFormOptions(false, this.globalState.NOTHING_CHOSEN, this.globalState.NO_ACCESSION_CHOSEN, false)); // note: will likely be called again with a chosen bio ID
    }

    // NOTE: This component shows all the stories for a given biography.
    // A required argument is the biography ID (now a string accession value).
    ngOnInit() {
        this.route.params.forEach((params: Params) => {
            var titlePiece: string;

            this.titleForEmptyStorySet = null;
            this.titleForCompletedStorySet = null;
            this.titleManagerService.setTitle("Biography Story Set, Results Pending"); // placeholder until content load tried

            // NOTE:  ID is expected
            if (params['ID'] !== undefined) {
                this.myAccession = params['ID'];

                this.getBiographyResults(); // assumes this.myAccession already set
            }
            else { // never expected, i.e., we assume we will have a valid accession ID in this.myAccession, but just in case, clear out interface
                this.bioDetail = null;
                this.myAccession = "";
                this.titleForEmptyStorySet = "Biography Story Set Empty (missing biography identifier)";
                this.titleForCompletedStorySet = null;
                this.titleManagerService.setTitle(this.titleForEmptyStorySet);
                this.liveAnnouncer.announce(this.titleForEmptyStorySet); // NOTE: using LiveAnnouncer to eliminate possible double-speak
            }
        });
    }

    // With optional city, state, and country specifiers, return a string of the form:
    // city or city, state or city, state, country or just state, country or just country or city, country, etc.
    private getBirthLocationString():Nullable<string> {
        var workVal: string;
        var accumulatedVal: Nullable<string> = null;

        if (this.bioDetail != null)
        {
            accumulatedVal = ""; // might grow into a combination of city state country 
            if (this.bioDetail.birthCity != null)
                accumulatedVal = this.bioDetail.birthCity.trim();

            if (this.bioDetail.birthState != null) {
                workVal = this.bioDetail.birthState.trim();
                if (workVal.length > 0) {
                    if (accumulatedVal.length > 0)
                        accumulatedVal = accumulatedVal + ", " + workVal;
                    else
                        accumulatedVal = workVal;
                }
            }

            if (this.bioDetail.birthCountry != null) {
                workVal = this.bioDetail.birthCountry.trim();
                if (workVal.length > 0) {
                    if (accumulatedVal.length > 0)
                        accumulatedVal = accumulatedVal + ", " + workVal;
                    else
                        accumulatedVal = workVal;
                }
            }
            if (accumulatedVal.length == 0)
                accumulatedVal = null; // if we ended up with an empty string, return null instead
        }
        return accumulatedVal;
    }

    private getBiographyResults() {
        this.biographyStorySetService.getStoriesInBiography(this.myAccession).pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(
              bioDetail => {
                var oneSessionInterviewInfo: string;

                this.bioDetail = bioDetail;

                if (bioDetail != null) {
                    this.searchFormService.setSearchOptions(new SearchFormOptions(false, bioDetail.biographyID, bioDetail.accession, false)); // let search form know we will search within this bio for stories

                    this.tailoredImage = this.myMediaBase + "biography/image/" + bioDetail.biographyID;
                    if (bioDetail.birthDate == null)
                        this.tailoredBirthDate = null;
                    else
                        this.tailoredBirthDate = this.globalState.cleanedMonthDayYear(bioDetail.birthDate);
                    if (bioDetail.deceasedDate == null)
                        this.tailoredDeceasedDate = null;
                    else
                        this.tailoredDeceasedDate = this.globalState.cleanedMonthDayYear(bioDetail.deceasedDate);
                    this.tailoredBirthLocation = this.getBirthLocationString();

                    var facetIndicators: string[] = [];
                    var i: number;
                    var oneFacetIndicator: string;

                    for (i = 0; i < bioDetail.occupationTypes.length; i++) {
                        oneFacetIndicator = bioDetail.occupationTypes[i];
                        facetIndicators.push(oneFacetIndicator);
                    }
                    this.EstablishFavoritesBlock(bioDetail.favorites);

                    this.tailoredJobFamilyList = null;
                    this.historyMakerService.getJobFamilyList(facetIndicators).pipe(takeUntil(this.ngUnsubscribe))
                      .subscribe(bioDetailJobList => {
                        this.tailoredJobFamilyList = bioDetailJobList;
                        this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                    });
                    facetIndicators = [];
                    for (i = 0; i < bioDetail.makerCategories.length; i++) {
                        oneFacetIndicator = bioDetail.makerCategories[i];
                        facetIndicators.push(oneFacetIndicator);
                    }
                    this.tailoredMakerGroupList = null;
                    this.historyMakerService.getMakerGroupList(facetIndicators).pipe(takeUntil(this.ngUnsubscribe))
                      .subscribe(bioDetailMakerGroupList => {
                        this.tailoredMakerGroupList = bioDetailMakerGroupList;
                        this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                    });

                    var oneStringFacet: string;
                    var collectedFacetList: string = "";
                    for (i = 0; i < bioDetail.occupations.length; i++) {
                        oneStringFacet = bioDetail.occupations[i];
                        if (oneStringFacet != null && oneStringFacet.trim().length > 0)
                            collectedFacetList += oneStringFacet + ", "; // use , as separator
                    }
                    if (collectedFacetList.length > 0)
                        this.tailoredOccupationList = collectedFacetList.substring(0, collectedFacetList.length - 2);
                    else
                        this.tailoredOccupationList = null;

                    // Update title with name (we may not have had it earlier) and story count.
                    // Compute specific format for tape titles as well, and cache the tape abstracts in string array tapeSummariesCache
                    // For each session holding information about an interview, make a string description of that interview, too.
                    // Finally, store StoryDocument records for each story into 2 forms of organization: a flat list (myStoryList), and a list
                    // of stories organized into each parent tape (myStoryListByTape), allowing quick easy toggling with readable html
                    // in the presentation layer.
                    this.tapeTitlesCache = [];
                    this.bioSessionDetails = [];
                    this.tapeSummariesCache = [];
                    this.myStoryList = [];
                    this.myStoryListByTape = [];
                    this.USStateDistribution = null;
                    var oneTapeStoryList: StoryDocument[] = [];
                    var storyCount: number = 0;
                    var oneStoryDocument: StoryDocument;
                    var oneStoryDuration: number;
                    var totalMSecsDuration: number = 0;
                    for (i = 0; i < bioDetail.sessions.length; i++) {
                        oneSessionInterviewInfo = "Interviewed on " + this.globalState.cleanedMonthDayYear(bioDetail.sessions[i].interviewDate) + " by " +
                            bioDetail.sessions[i].interviewer + " at " + bioDetail.sessions[i].location + ", videographer " + bioDetail.sessions[i].videographer;
                        this.bioSessionDetails.push(oneSessionInterviewInfo);
                        for (var j = 0; j < bioDetail.sessions[i].tapes.length; j++) {
                            this.tapeTitlesCache.push("Tape " + bioDetail.sessions[i].tapes[j].tapeOrder + ", " +
                            this.globalState.cleanedMonthDayYear(bioDetail.sessions[i].interviewDate));
                            this.tapeSummariesCache.push(bioDetail.sessions[i].tapes[j].abstract);
                            oneTapeStoryList = [];
                            if (bioDetail.sessions[i].tapes[j].stories != null) {
                                storyCount += bioDetail.sessions[i].tapes[j].stories.length;
                                for (var k = 0; k < bioDetail.sessions[i].tapes[j].stories.length; k++) {
                                    oneStoryDuration = bioDetail.sessions[i].tapes[j].stories[k].duration;
                                    oneStoryDocument = new StoryDocument(bioDetail.sessions[i].tapes[j].stories[k].storyID, bioDetail.biographyID, this.myAccession,
                                        String(bioDetail.sessions[i].sessionOrder), String(bioDetail.sessions[i].tapes[j].tapeOrder), bioDetail.sessions[i].tapes[j].stories[k].storyOrder, 
                                        bioDetail.sessions[i].tapes[j].stories[k].title, oneStoryDuration, bioDetail.sessions[i].interviewDate);
                                    
                                    totalMSecsDuration += oneStoryDuration;
                                    this.myStoryList.push(oneStoryDocument);
                                    oneTapeStoryList.push(oneStoryDocument);
                                }
                            }
                            this.myStoryListByTape.push(oneTapeStoryList);
                        }
                    }
                    var pendingTitle: string = bioDetail.preferredName;
                    var countFragment: string;
                    if (pendingTitle != null && pendingTitle.length > 0)
                        pendingTitle += ", ";
                    else
                        pendingTitle = "";
                    if (storyCount != 1) {
                      countFragment = storyCount + " Stories";
                    }
                    else {
                      countFragment = "1 Story";
                    }
                    pendingTitle += countFragment; // NOTE: pending title will be name, # stories format (not the total duration as well as that is too much for the title)
                    if (storyCount > 0) {
                      var durationFragment: string = this.convertToHHMMSS(totalMSecsDuration);
                      // NOTE: the summation will be of two forms: # Stories, hh:mm:ss and # Stories, total time hh:mm:ss
                      this.tailoredStorySummationNarrow = countFragment + ", " + durationFragment;
                      this.tailoredStorySummationWide = countFragment + ", total time " + durationFragment;
                    }
                    else {
                      // Same format for summation, just 0 stories
                      this.tailoredStorySummationNarrow = countFragment;
                      this.tailoredStorySummationWide = countFragment;
                    }

                    // !!!TBD!!! NOTE: Until the API is updated, US State information is NOT returned from the getStoriesInBiography service call
                    // for stories within a biography.  Make a separate call that will load up this information for the stories.  Also, this implies
                    // that for this view, for biography-storyset, there is no filtering: all the stories for this biography are included.
                    // Before October 2021: This was done via an IDSearch using all the story IDs for this person.  That could be a long list, and a bug
                    // was discovered in LibLynx layers that long URLs during authentication were truncated.  So, instead, we can do a story search for * (all)
                    // within this person, which is the method used here, avoiding the need for a long ID list.
                    // OLD: this.idSearchService.getIDSearch(IDListToLoad, 1, this.myStoryList.length + 1)
                    // NEW: this.textSearchService.getTextSearch("*", "", bioDetail.biographyID, .. (no filters)
                    if (bioDetail.biographyID != this.globalState.NOTHING_CHOSEN) {
                        this.textSearchService.getTextSearch("*", "", bioDetail.biographyID, false, false, null, null, null, null, null, null, null, null, null, null, null, false)
                          .pipe(takeUntil(this.ngUnsubscribe)).subscribe(retSet => {
                            this.initializeUSStateCounts(bioDetail.preferredName, retSet); // harvest and use the entities/states facet to populate the US state region counts
                            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                        },
                        error => { // give up on finding additional map information for the story set
                            this.initializeUSStateCounts(bioDetail.preferredName, null); // effectively empties the map view of any story information
                            this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                        });
                    }

                    this.titleForEmptyStorySet = null; // not needed, redundant with information shown elsewhere
                    this.titleForCompletedStorySet = pendingTitle;
                    this.titleManagerService.setTitle(pendingTitle);
                    this.liveAnnouncer.announce(pendingTitle); // NOTE: using LiveAnnouncer to eliminate possible double-speak

                    this.isNonemptyContent = true;
                    this.toggleDetailsLabel = "Hide Summaries";
                    this.tapeSummariesShown = true; // default to showing them once loaded
                    this.setFocusAsNeeded(); // set focus once context and content fully loaded
                    this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                }
                else {
                    // No biography details available
                    this.tailoredImage = null;
                    this.tailoredBirthDate = null;
                    this.tailoredDeceasedDate = null;
                    this.tailoredJobFamilyList = null;
                    this.tailoredOccupationList = null;
                    this.tailoredMakerGroupList = null;
                    this.isNonemptyContent = false;
                    this.tapeSummariesShown = false;
                    this.ClearFavoritesBlock();
                    this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
                }
              }
            );
    }

    // Return a hh:mm:ss format equivalent to the specified number of milliseconds, dropping out fractional part
    // and returning 0:ss for values under a minute.  Return 0:00 for negative values or 0, and
    // impose a ceiling of 99:59:59 for huge values.
    private convertToHHMMSS(givenVal: number): string {
        const MAX_MILLISECS_SUPPORTED = 359999; // 99 hours and 59 minutes and 59 seconds, 99:59:59
        var workVal = Math.floor(givenVal / 1000); // convert milliseconds to seconds
        var fullString: string = "";

        // Protect for goofy values:
        if (workVal < 0)
            workVal = 0;
        else if (workVal > MAX_MILLISECS_SUPPORTED)
            workVal = MAX_MILLISECS_SUPPORTED;
        var hours = Math.floor(workVal / 3600);
        workVal -= (hours * 3600);
        var minutes = Math.floor(workVal / 60);
        var seconds = workVal - (60 * minutes);
        var hoursString: string = hours.toString();
        var minutesString: string = minutes.toString();

        var secondsString: string = seconds.toString();
        if (secondsString.length == 1)
            secondsString = "0" + secondsString;
        if (hours == 0)
          fullString = minutesString + ":" + secondsString;
        else
        {
          if (minutesString.length == 1)
            minutesString = "0" + minutesString;
          fullString = hours + ":" + minutesString + ":" + secondsString;
        }
        return fullString;
    }

    private setFocusAsNeeded() {
        var focusSetElsewhere: boolean = false;

        // Check on scroll and focus to selected story item once everything is set up, but only do focus/scroll action
        // if focus is not set to something else above.
        var selectedItem: number = this.userSettingsManagerService.currentStoryIDToFocus();
        if (selectedItem != this.globalState.NOTHING_CHOSEN) {
            if (!focusSetElsewhere) {
                this.signalFocusToStoryID = selectedItem; // can focus to story item because nothing else was picked earlier
                focusSetElsewhere = true;
            }
            // Once used, or once something else was focused on via "focusSetElsewhere", clear it.
            this.userSettingsManagerService.updateStoryIDToFocus(this.globalState.NOTHING_CHOSEN);
        }
        // If any routes being returned back to have a way to put focus on this particular Maker (biography ID),
        // indicate that it should be done via a user setting "BioIDToFocus" since biography is this route's context:
        this.userSettingsManagerService.updateBioIDToFocus(this.myAccession);

        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            if (!focusSetElsewhere)
                // Set default focus to the title for this route, since we did internally route
                // in the SPA (single page application)
                // (as it is the target for skip-to-main content as well)
                this.signalFocusToTitle = true;
        }

        // If we used pending focus flags, here is where they would be reset, after signals are all in place: this.clearPendingFocusInstructions();
    }
    private clearSignalsForCurrentFocusSetting() {
        this.signalFocusToStoryID = this.globalState.NOTHING_CHOSEN;
        this.signalFocusToTitle = false;
    }

    private initializeUSStateCounts(ownerName: string, resultSet: Nullable<SearchResult>) {
        var keyEntitySetCount: number;
        var keyTitle: string;
        var keySuffix: string;
        var count: number[];

        if (ownerName && ownerName.length > 0) {
            keyTitle = "States Mentioned in Stories for " + ownerName;
            keySuffix = "from " + ownerName; // used to compose key message of form: "1 Story from Timuel Black" etc.
        }
        else {
            keyTitle = "States Mentioned in One Person's Stories";
            keySuffix = "from this person"; // used to compose key message of form: "20 Stories from this person" etc.
        }

        if (resultSet)
            keyEntitySetCount = resultSet.count;
        else
            keyEntitySetCount = 0;

        count = [];
        // Initially zero out the count.  Then, update if we have a resultSet
        for (var i = 0; i <= 51; i++)
            count.push(0);

        if (resultSet && resultSet.facets && resultSet.facets.entityStates && resultSet.facets.entityStates.length > 0) {
            // Handle region (U.S. state):
            var oneFacetID: string;
            var oneFacetCount: number;
            var numericIndexForMap: number;
            for (i = 0; i < resultSet.facets.entityStates.length; i++) {
                oneFacetCount = resultSet.facets.entityStates[i].count;
                oneFacetID = resultSet.facets.entityStates[i].value; // two-letter code e.g., NY or PA or DC
                numericIndexForMap = this.globalState.MapIndexForUSState(oneFacetID);
                count[numericIndexForMap] = oneFacetCount;
            }
        }
        // Set the distribution (used in map view)
        this.USStateDistribution = new USMapDistribution(count, "U.S. State", keyEntitySetCount, keyTitle, "story", "stories", keySuffix, 
            "discuss", "discusses", "Discussed in", null, ""); 
    }

    // Set interface for empty results.  If no improvedTitle is given, use "No stories found." as the title.
    private setInterfaceForEmptyStorySet(improvedTitle: string) {
        if (improvedTitle == null || improvedTitle.length == 0)
            this.titleForEmptyStorySet = "No stories found";
        else
            this.titleForEmptyStorySet = improvedTitle;
        this.titleForCompletedStorySet = null;
        this.titleManagerService.setTitle(this.titleForEmptyStorySet + " | Biography Story Set");
        this.liveAnnouncer.announce("Empty Biography Story Set"); // NOTE: using LiveAnnouncer to eliminate possible double-speak
        this.isNonemptyContent = false;
        this.tapeSummariesShown = false;
    }

    filterOnUSMapRegion(chosenUSMapRegionID: string, isClearAction: boolean) {
        // In this particular interface, given region can never be already picked, so just filter on the given region.
        // That is, we have a biography and its stories shown, or with a map around the biography and the geographical coverage of its stories.
        // As soon as a filter on map region that is NOT a clear action is taken, that initiates a search to just those stories with 
        // the clicked geographic region, accomplished by navigating to a route of stories/2 (search within a biography) along with the region filter 
        // specification and the biography ID as parameters.
        // A route like .../storiesForBio;ID=A2006.075 is same as route like
        // .../stories/2;q=*;pg=1;pgS=30;ip=6101;ia=A2006.075 which can turn into a filtered-to-one-region route of:
        // .../stories/2;ffu=1;pgS=30;spec=----VA---;q=*;sT=0;sS=0;ip=6101;ia=A2006.075;pg=1 or simplied to:
        // .../stories/2;spec=----VA---;q=*;ip=6101;ia=A2006.075
        // It is unlikely a user could trigger a clear action before the route to do the clicked action is taken, but just in case,
        // do nothing for clear actions - don't navigate.
        if (isClearAction) {
            return;
        }
        if (chosenUSMapRegionID && chosenUSMapRegionID.length == 2) {
            // Only continue with 2-letter US Map Region IDs...
            var moreParams: Record<string, string | number> = {};

            moreParams['ia'] = this.myAccession;
            if (this.bioDetail != null)
                moreParams['ip'] = this.bioDetail.biographyID;
            else
                moreParams['ip'] = this.globalState.NOTHING_CHOSEN;

            moreParams['q'] = "*"; // return ALL stories for this biography ID
            moreParams['spec'] = "----" + chosenUSMapRegionID + "---";
            // !!!TBD!!! This knowledge of the length for the filter specification is something that could be fixed by centralizing search filtering!

            this.clearSignalsForCurrentFocusSetting(); // forget signals before launching router navigation
            this.router.navigate(['/stories/2', moreParams]);
        }
    }

    goBack($event: MouseEvent): void {
        $event.preventDefault();

        // !!!TBD!!! FYI, as needed this.routerHistoryService.previousUrl holds this route where we
        // head back to; see router-history for context and credit with RouterHistoryService sourced like WindowService

        this.windowService.nativeWindow.history.back();
    }

    toggleDetails() {
        if (this.tapeSummariesShown) {
            this.tapeSummariesShown = false;
            this.toggleDetailsLabel = "Show Summaries";
        }
        else {
            this.tapeSummariesShown = true;
            this.toggleDetailsLabel = "Hide Summaries";
        }
    }

    private EstablishFavoritesBlock(givenFavs: Nullable<BiographyFavorites>) {
        var candidate: string;

        this.ClearFavoritesBlock(); // have favorites empty unless we get valid content
        if (givenFavs)
        {
            if (givenFavs.color != null) {
                candidate = givenFavs.color.trim();
                if (this.IsAcceptableAnswer(candidate))
                    this.biographyFavoriteColor = candidate;
            }

            if (givenFavs.food != null) {
                candidate = givenFavs.food.trim();
                if (this.IsAcceptableAnswer(candidate))
                    this.biographyFavoriteFood = candidate;
            }

            if (givenFavs.timeOfYear != null) {
                candidate = givenFavs.timeOfYear.trim();
                if (this.IsAcceptableAnswer(candidate))
                    this.biographyFavoriteTimeOfYear = candidate;
            }

            if (givenFavs.vacationSpot != null) {
                candidate = givenFavs.vacationSpot.trim();
                if (this.IsAcceptableAnswer(candidate))
                    this.biographyFavoriteVacationSpot = candidate;
            }

            if (givenFavs.quote != null) {
                candidate = givenFavs.quote.trim();
                if (this.IsAcceptableAnswer(candidate))
                    this.biographyFavoriteQuote = candidate;
            }
        }
    }

    private IsAcceptableAnswer(candidate: string): boolean {
        const NOT_ASKED_MARKER: string = "not asked";
        const NOT_ANSWERED_MARKER: string = "none";
        const NOT_APPLICABLE_MARKER: string = "n/a";
        var candidateToTest = candidate.toLowerCase();
        return (candidateToTest.length > 0 && candidateToTest != NOT_ASKED_MARKER && candidateToTest != NOT_ANSWERED_MARKER &&
              candidateToTest != NOT_APPLICABLE_MARKER);
    }

    private ClearFavoritesBlock() {
        this.biographyFavoriteColor = null;
        this.biographyFavoriteFood = null;
        this.biographyFavoriteTimeOfYear = null;
        this.biographyFavoriteVacationSpot = null;
        this.biographyFavoriteQuote = null;
    }

    public setViewOptions(eventCode: string, comingFromPicOption: boolean, comingFromTextOption: boolean) {
        if (comingFromPicOption) {
            // Next is text, back is map, current is pic grid.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewOption(false, true); // set "text"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewOption(false, false); // set "map"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsGrid);
            }
        }
        else if (comingFromTextOption) {
            // Next is map, back is pic, current is text.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewOption(false, false); // set "map"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewOption(true, false); // set "pic"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsText);
            }
        }
        else {
            // Next is pic, back is text, current is map.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewOption(true, false); // set "pic"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewOption(false, true); // set "text"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsMap);
            }
        }
    }

    public setViewOptionsInNarrowContainer(eventCode: string, comingFromPicOption: boolean, comingFromTextOption: boolean) {
        if (comingFromPicOption) {
            // Next is text, back is map, current is pic grid.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewInNarrowContainer(false, true); // set "text"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewInNarrowContainer(false, false); // set "map"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsGrid);
            }
        }
        else if (comingFromTextOption) {
            // Next is map, back is pic, current is text.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewInNarrowContainer(false, false); // set "map"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewInNarrowContainer(true, false); // set "pic"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsText);
            }
        }
        else {
            // Next is pic, back is text, current is map.
            if (eventCode == "ArrowDown" || eventCode == "ArrowRight")
                this.focusPicViewInNarrowContainer(true, false); // set "pic"
            else if (eventCode == "ArrowUp" || eventCode == "ArrowLeft")
                this.focusPicViewInNarrowContainer(false, true); // set "text"
            else if (eventCode == " " || eventCode == "Enter") {
                this.updateViewOptions(ViewState.AsMap);
            }
        }
    }

    public updateViewOptions(anticipatedView: ViewState) {
        this.viewStateSignal.set(anticipatedView);
    }

    private focusPicViewInNarrowContainer(settingPicStampFocus: boolean, settingTextStampFocus: boolean) {
        if (settingPicStampFocus) { // set focus to radioGroup1_Pic
            const radioGroup1_Pic = this.radioGroup1_Pic();
            if (radioGroup1_Pic && radioGroup1_Pic.nativeElement)
                radioGroup1_Pic.nativeElement.focus();
        }
        else if (settingTextStampFocus) { // set focus to radioGroup1_Text
            const radioGroup1_Text = this.radioGroup1_Text();
            if (radioGroup1_Text && radioGroup1_Text.nativeElement)
                radioGroup1_Text.nativeElement.focus();
        }
        else { // set focus to radioGroup1_Map
            const radioGroup1_Map = this.radioGroup1_Map();
            if (radioGroup1_Map && radioGroup1_Map.nativeElement)
                radioGroup1_Map.nativeElement.focus();
        }
    }

    private focusPicViewOption(settingPicStampFocus: boolean, settingTextStampFocus: boolean) {
        if (settingPicStampFocus) { // set focus to radioGroup2_Pic
            const radioGroup2_Pic = this.radioGroup2_Pic();
            if (radioGroup2_Pic && radioGroup2_Pic.nativeElement)
                radioGroup2_Pic.nativeElement.focus();
        }
        else if (settingTextStampFocus) { // set focus to radioGroup2_Text
            const radioGroup2_Text = this.radioGroup2_Text();
            if (radioGroup2_Text && radioGroup2_Text.nativeElement)
                radioGroup2_Text.nativeElement.focus();
        }
        else { // set focus to radioGroup2_Map
            const radioGroup2_Map = this.radioGroup2_Map();
            if (radioGroup2_Map && radioGroup2_Map.nativeElement)
                radioGroup2_Map.nativeElement.focus();
        }
    }
}
