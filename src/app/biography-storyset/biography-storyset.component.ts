import { Component, Input, Output, OnInit, EventEmitter, Inject } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';
import { BriefStory } from './brief-story';
import { BiographyStorySetService } from './biography-storyset.service';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TitleManagerService } from '../title-manager.service';
import { MenuService } from '../menu/menu.service';
import { PlaylistManagerService } from '../playlist-manager/playlist-manager.service'

import { StorySetType} from '../storyset/storyset-type';
import { StoryDocument} from '../storyset/story-document';
import { GlobalState } from '../app.global-state';
import { environment } from '../../environments/environment';

import { DetailedBiographyStorySet } from './detailed-biography-storyset';
import { BiographyFavorites } from '../story/biography-favorites';
import { Playlist } from '../shared/playlist/playlist';

@Component({
    selector: 'my-bio-storyset',
    templateUrl: './biography-storyset.component.html',
    styleUrls: ['./biography-storyset.component.scss']
})
export class BiographyStorySetComponent implements OnInit {

    myAccession: string;
    titleForStorySet: string = null;

    storiesTextQuery: string = ""; // this query string is for the common-area text search input (TODO: could become a search behavior in refactoring of code if this stays across pages !!!TBD!!!)

    specFromParent: string; // a pass-through value from caller, used in routing out via goBack call
    pageSizeFromParent: number; // a pass-through value from caller, used in routing out via goBack call
    currentPageFromParent: number; // a pass-through value from caller, used in routing out via goBack call
    queryFromParent: string;
    searchJustLastNameFlagFromParent: boolean;
    searchJustPreferredNameFlagFromParent: boolean;
    searchFieldSortOrderSpecifierFromParent: number;
    reduceToBornThisTimeFlagFromParent: boolean; // NOTE: this time might be this day, this week, etc.

    needToggleDetails: boolean = false;
    toggleDetailsLabel: string;
    tapeSummariesShown: boolean = false;

    tapeTitlesCache: string[] = []; // At client request, title the tape "chunk" in a particular way when tapeSummariesShown
    tapeSummariesCache: string[] = [];
    myStoryListByTape: StoryDocument[][];
    myStoryList: StoryDocument[];
    bioSessionDetails: string[] = [];

    selectedStoryID: number; // ID of the story, if any, that is selected in the story list

    bioDetail: DetailedBiographyStorySet;

    tailoredJobFamilyList: string;
    tailoredOccupationList: string;
    tailoredMakerGroupList: string;
    tailoredBirthDate: string;
    tailoredBirthLocation: string;
    tailoredDeceasedDate: string;
    tailoredImage: string;
    tailoredStoryCountInfo: string;
    biographyFavoriteColor: string;
    biographyFavoriteFood: string;
    biographyFavoriteTimeOfYear: string;
    biographyFavoriteVacationSpot: string;
    biographyFavoriteQuote: string;

    cardView: boolean = true;

    txtQuery: string = ""; // this is the query string as edited by the user
    inputPlaceholder: string;
    searchTitleOnly: boolean;
    searchTranscriptOnly: boolean;
    resultsSize: number;
    searchLastNameOnly: boolean;
    searchPreferredNameOnly: boolean;
    fields: string[] = ['all fields','title','transcript']
    searchByField: string;
    biographyIDForLimitingSearch: number;
    myMediaBase: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private biographyStorySetService: BiographyStorySetService,
        private historyMakerService: HistoryMakerService,
        private titleManagerService: TitleManagerService,
        private menuService: MenuService,
        private playlistManagerService: PlaylistManagerService) {

        this.myMediaBase = environment.mediaBase;
    }

    // NOTE: This component shows all the stories for a given biography.
    // A required argument is the biography ID (now a string accession value).
    // Optional arguments are sID for selected story ID (what to highlight/page into view, if anything), as well as information
    // about the calling context.
    //
    // The routing "pspec" is for the caller context, e.g.,  parent might be all female list of interviewees, that info passed here as "pspec"
    // so that on "Entire Interview" the list of all females is brought back. Likewise the parent might be on page 4 with page size of 30, so there are
    // also parent page size and parent page parameters along with parent specification.
    // So, have "parent" context of ppg, ppgS, pspec.  Parent might have query too, so other optional parameters are q (query),
    // and t (title only).
    ngOnInit() {
        this.inputPlaceholder = "Search this person's stories...";
        this.searchTitleOnly = GlobalState.SearchTitleOnly;
        this.searchTranscriptOnly = GlobalState.SearchTranscriptOnly;
        this.resultsSize = GlobalState.SearchPageSize;
        this.menuService.setSearchOption('storiesInBio');
        this.setField();
        this.route.params.forEach((params: Params) => {
            var proposedSelectedStoryID: number; // it will only be "proposed" until a story set is resolved; then it can be acted on....
            var titlePiece: string;

            this.titleForStorySet = null;
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            if (params['sID'] !== undefined)
                proposedSelectedStoryID = +params['sID'];
            else
                proposedSelectedStoryID = GlobalState.NOTHING_CHOSEN;

            // Get parent context (specification, page, page size) which may be undefined. Parent context is pspec, ppg, ppgS (NOT local spec, pg, pgS).
            this.specFromParent = null;
            this.pageSizeFromParent = null;
            this.currentPageFromParent = null;
            this.queryFromParent = null;
            this.searchJustLastNameFlagFromParent = null;
            this.searchJustPreferredNameFlagFromParent = null;
            this.searchFieldSortOrderSpecifierFromParent = null;
            this.reduceToBornThisTimeFlagFromParent = null;

            if (params['pspec'] !== undefined) {
                this.specFromParent = params['pspec'];
                if (this.specFromParent.length == 0)
                    this.specFromParent = null; // spec of "" same as no spec at all
            }

            if (params['q'] !== undefined) {
                this.queryFromParent = params['q'];
                if (this.queryFromParent.length == 0)
                    this.queryFromParent = null; // query of "" same as no query at all
            }

            if (params['ln'] !== undefined) {
                this.searchJustLastNameFlagFromParent = (params['ln'] == "1");
            }

            if (params['pn'] !== undefined) {
                this.searchJustPreferredNameFlagFromParent = (params['pn'] == "1");
            }

            if (params['so'] !== undefined && !isNaN(+params['so'])) {
                this.searchFieldSortOrderSpecifierFromParent = +params['so'];
            }

            if (params['bt'] !== undefined) {
                this.reduceToBornThisTimeFlagFromParent = (params['bt'] == "1");
            }

            if (params['ppgS'] !== undefined) {
                var candidatePageSize = +params['ppgS'];
                if (candidatePageSize != null && candidatePageSize > 0)
                    this.pageSizeFromParent = candidatePageSize;
            }

            if (params['ppg'] !== undefined) {
                var candidatePage = +params['ppg'];
                if (candidatePage != null && candidatePage > 0)
                    this.currentPageFromParent = candidatePage;
            }

            // NOTE:  ID is expected
            if (params['ID'] !== undefined) {
                this.titleForStorySet = "Searching... (in progress)";
                this.myAccession = params['ID'];

                this.getBiographyResults(proposedSelectedStoryID); // assumes this.myAccession already set
            }
            else { // never expected, i.e., we assume we will have a valid accession ID in this.myAccession, but just in case, clear out interface
                this.bioDetail = null;
                this.titleForStorySet = "This page requires a biography accession ID to then load the biography details.";
            }
        });
    }

    // toggleMenu() {
    //     this.menuState.emit('close');
    // }

    doSearch() {
        GlobalState.SearchTitleOnly = this.searchTitleOnly;
        GlobalState.SearchTranscriptOnly = this.searchTranscriptOnly;

        // Accumulate routing parameters specifying filter specification, page information, etc.
        if (this.txtQuery != null && this.txtQuery.length > 0) {
            // Proceed with route parameter computations and doing the search.
            var moreOptions = [];

            moreOptions['q'] = GlobalState.cleanedRouterParameter(this.txtQuery);
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            moreOptions['pg'] = 1; // always show page 1 of new query
            moreOptions['pgS'] = GlobalState.SearchPageSize; // use global context page size

            if (this.searchTitleOnly) // use explicit "search-title-only" indicator of sT if true
                moreOptions['sT'] = "1";
            else if (this.searchTranscriptOnly) // use explicit "search-transcript-only" indicator of sS (search spoken) if true
                moreOptions['sS'] = "1";
            // else default to "both" without the use of an explicit flag

            if (this.biographyIDForLimitingSearch != null && this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN)
                moreOptions['ip'] = this.biographyIDForLimitingSearch; // flag that an "inside THIS person" search context will be set and used

            this.router.navigate(['/stories', StorySetType.TextSearch, moreOptions]);
        }
    }

    noNeedForSearch(): boolean { // Returns true iff there is no need for search action (i.e., no search query).
        return (this.txtQuery == null || this.txtQuery.length == 0);
    }

    setPageSize(newSize: number) {
        GlobalState.SearchPageSize = newSize;
        this.resultsSize = newSize;
     }

    setField() {
        if (this.searchTitleOnly === true) {
            this.searchByField = "title";
        }
        else if (this.searchTranscriptOnly === true) {
            this.searchByField = "transcript";
        }
        else { // "both" picked, so do not limit search to just one field or the other
            this.searchByField = "all fields";
        }
    }

    searchFieldChange(currentPick: string) {
        if (currentPick == "title") {
            this.searchTitleOnly = true;
            this.searchTranscriptOnly = false;
        }
        else if (currentPick == "transcript") {
            this.searchTitleOnly = false;
            this.searchTranscriptOnly = true;
        }
        else { // "both" picked, so do not limit search to just one field or the other
            this.searchTitleOnly = false;
            this.searchTranscriptOnly = false;
        }
        this.searchByField = currentPick;
        GlobalState.SearchTitleOnly = this.searchTitleOnly;
        GlobalState.SearchTranscriptOnly = this.searchTranscriptOnly;
    }

    routeToAdvancedSearch() {
        var moreOptions = [];

        if (this.biographyIDForLimitingSearch != null && this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN)
            moreOptions['ip'] = this.biographyIDForLimitingSearch; // flag that an "inside THIS person" search context will be set and used

        this.router.navigate(['/storyadvs', moreOptions]);
    }

    // With optional city, state, and country specifiers, return a string of the form:
    // city or city, state or city, state, country or just state, country or just country or city, country, etc.
    private getBirthLocationString() {
        var workVal: string;
        var accumulatedVal: string = "";

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
        return accumulatedVal;
    }

    private getBiographyResults(proposedSelectedStoryID: number) {
        this.biographyStorySetService.getStoriesInBiography(this.myAccession)
            .subscribe(
              bioDetail => {
                var pageSizeInEffectiveUse: number;
                var totalCount: number;
                var oneSessionInterviewInfo: string;

                this.bioDetail = bioDetail;

                if (bioDetail != null) {
                    this.biographyIDForLimitingSearch = bioDetail.biographyID;
                    this.menuService.setBiographyID(bioDetail.biographyID);
                    this.tailoredImage = this.myMediaBase + "biography/image/" + bioDetail.biographyID;
                    if (bioDetail.birthDate == null)
                        this.tailoredBirthDate = "";
                    else
                        this.tailoredBirthDate = GlobalState.cleanedMonthDayYear(bioDetail.birthDate);
                    if (bioDetail.deceasedDate == null)
                        this.tailoredDeceasedDate = "";
                    else
                        this.tailoredDeceasedDate = GlobalState.cleanedMonthDayYear(bioDetail.deceasedDate);
                    this.tailoredBirthLocation = this.getBirthLocationString();

                    var facetIndicators: number[] = [];
                    var i: number;
                    var oneFacetIndicator: number;

                    for (i = 0; i < bioDetail.occupationTypes.length; i++) {
                        oneFacetIndicator = Number(bioDetail.occupationTypes[i]);
                        if (!isNaN(oneFacetIndicator))
                            facetIndicators.push(oneFacetIndicator);
                    }
                    this.EstablishFavoritesBlock(bioDetail.favorites);

                    this.tailoredJobFamilyList = null;
                    this.historyMakerService.getJobFamilyList(facetIndicators)
                      .subscribe(
                        bioDetailJobList => {
                          this.tailoredJobFamilyList = bioDetailJobList;
                    });
                    facetIndicators = [];
                    for (i = 0; i < bioDetail.makerCategories.length; i++) {
                        oneFacetIndicator = Number(bioDetail.makerCategories[i]);
                        if (!isNaN(oneFacetIndicator))
                            facetIndicators.push(oneFacetIndicator);
                    }
                    this.tailoredMakerGroupList = null;
                    this.historyMakerService.getMakerGroupList(facetIndicators)
                      .subscribe(
                        bioDetailMakerGroupList => {
                          this.tailoredMakerGroupList = bioDetailMakerGroupList;
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
                        this.tailoredOccupationList = "";

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
                    var oneTapeStoryList: StoryDocument[] = [];
                    var storyCount: number = 0;
                    var oneStoryDocument: StoryDocument;
                    for (i = 0; i < bioDetail.sessions.length; i++) {
                        oneSessionInterviewInfo = "Interviewed on " + GlobalState.cleanedMonthDayYear(bioDetail.sessions[i].interviewDate) + " by " +
                            bioDetail.sessions[i].interviewer + " at " + bioDetail.sessions[i].location + ", videographer " + bioDetail.sessions[i].videographer;
                        this.bioSessionDetails.push(oneSessionInterviewInfo);
                        for (var j = 0; j < bioDetail.sessions[i].tapes.length; j++) {
                            this.tapeTitlesCache.push("Tape " + bioDetail.sessions[i].tapes[j].tapeOrder + ", " +
                                GlobalState.cleanedMonthDayYear(bioDetail.sessions[i].interviewDate));
                            this.tapeSummariesCache.push(bioDetail.sessions[i].tapes[j].abstract);
                            oneTapeStoryList = [];
                            if (bioDetail.sessions[i].tapes[j].stories != null) {
                                storyCount += bioDetail.sessions[i].tapes[j].stories.length;
                                for (var k = 0; k < bioDetail.sessions[i].tapes[j].stories.length; k++) {
                                    oneStoryDocument = new StoryDocument();
                                    oneStoryDocument.duration = bioDetail.sessions[i].tapes[j].stories[k].duration;
                                    oneStoryDocument.storyID = bioDetail.sessions[i].tapes[j].stories[k].storyID;
                                    oneStoryDocument.title = bioDetail.sessions[i].tapes[j].stories[k].title;
                                    oneStoryDocument.storyOrder = bioDetail.sessions[i].tapes[j].stories[k].storyOrder;
                                    oneStoryDocument.accession = this.myAccession;
                                    oneStoryDocument.interviewDate = bioDetail.sessions[i].interviewDate;
                                    oneStoryDocument.sessionOrder = String(bioDetail.sessions[i].sessionOrder);
                                    oneStoryDocument.tapeOrder = String(bioDetail.sessions[i].tapes[j].tapeOrder);
                                    this.myStoryList.push(oneStoryDocument);
                                    oneTapeStoryList.push(oneStoryDocument);

                                    // Confirm whether proposed story ID to highlight is in set; if so, mark it for highlight
                                    if (proposedSelectedStoryID == oneStoryDocument.storyID) {
                                        this.selectedStoryID = proposedSelectedStoryID; // ID is in set, so use it as the current selection
                                    }
                                }
                            }
                            this.myStoryListByTape.push(oneTapeStoryList);
                        }
                    }
                    var pendingTitle: string = bioDetail.preferredName;
                    var fragment: string;
                    if (pendingTitle != null && pendingTitle.length > 0)
                        pendingTitle += ", ";
                    else
                        pendingTitle = "";
                    if (storyCount != 1) {
                        fragment = storyCount + " Stories";
                    }
                    else {
                        fragment = "1 Story";
                    }
                    pendingTitle += fragment;
                    this.tailoredStoryCountInfo = fragment;

                    this.titleForStorySet = null; // not needed, redundant with information shown elsewhere
                    this.titleManagerService.setTitle(pendingTitle);

                    this.needToggleDetails = true;
                    this.toggleDetailsLabel = "Hide Summaries";
                    this.tapeSummariesShown = true; // default to showing them once loaded
                }
                else {
                    // No biography details available
                    this.tailoredImage = null;
                    this.tailoredBirthDate = "";
                    this.tailoredDeceasedDate = "";
                    this.tailoredJobFamilyList = null;
                    this.tailoredOccupationList = null;
                    this.tailoredMakerGroupList = null;
                    this.needToggleDetails = false;
                    this.tapeSummariesShown = false;
                    this.ClearFavoritesBlock();
                }
              },
              error => {
                // TODO: perhaps add in more careful error processing with logging/analytics as needed
                this.setInterfaceForEmptyStorySet("");
              }
            );
    }

    // Set interface for empty results.  If no improvedTitle is given, use "No stories found." as the title.
    private setInterfaceForEmptyStorySet(improvedTitle: string) {
        if (improvedTitle == null || improvedTitle.length == 0)
            this.titleForStorySet = "No stories found.";
        else
            this.titleForStorySet = improvedTitle;
        this.titleManagerService.setTitle(GlobalState.EMPTY_STORY_SET_TITLE);

        this.selectedStoryID = null; // no stories to select
        this.needToggleDetails = false;
        this.tapeSummariesShown = false;
    }

    private setOptionsAndRouteToStoryPage(storyID: number) {
        // NOTE: Story ID is *REQUIRED* and so is part of router.navigate path below (along with /story) rather than in moreQueryParams.
        var moreQueryParams = [];

        // NOTE:  specification for filtering may be null, as may full name and others, but accession ID is expected.
        if (this.myAccession != null) {
            moreQueryParams['cID'] = this.myAccession;
            // Flag that story is from a list of stories from the biography set of stories:
            moreQueryParams['type'] = StorySetType.BiographyCollection;

            if (this.queryFromParent != null && this.queryFromParent.length > 0)
                moreQueryParams['q'] = GlobalState.cleanedRouterParameter(this.queryFromParent);
            if (this.searchJustLastNameFlagFromParent != null) {
                if (this.searchJustLastNameFlagFromParent)
                    moreQueryParams['ln'] = "1";
                else
                    moreQueryParams['ln'] = "0";
            }
            if (this.searchJustPreferredNameFlagFromParent != null) {
                if (this.searchJustPreferredNameFlagFromParent)
                    moreQueryParams['pn'] = "1";
                else
                    moreQueryParams['pn'] = "0";
            }
            if (this.searchFieldSortOrderSpecifierFromParent != null)
                moreQueryParams['so'] = this.searchFieldSortOrderSpecifierFromParent;

            if (this.reduceToBornThisTimeFlagFromParent != null) {
                if (this.reduceToBornThisTimeFlagFromParent)
                    moreQueryParams['bt'] = "1";
                else
                    moreQueryParams['bt'] = "0";
            }
            if (this.specFromParent != null && this.specFromParent.length > 0)
                moreQueryParams['pspec'] = this.specFromParent;
            if (this.currentPageFromParent != null && this.currentPageFromParent > 0)
                moreQueryParams['ppg'] = this.currentPageFromParent;
            if (this.pageSizeFromParent != null && this.pageSizeFromParent > 0)
                moreQueryParams['ppgS'] = this.pageSizeFromParent;
        }
        // else giving up being able to go back if the ID is not given for the biography; just go to story page without a "go back" option
        this.router.navigate(['/story', storyID, moreQueryParams]);
    }

    onSelected(givenStoryID: number) {
        this.selectedStoryID = givenStoryID;
        this.setOptionsAndRouteToStoryPage(this.selectedStoryID);
    }

    goBack() {
        var moreParams = {};
        this.selectedStoryID = null;

        moreParams['ID'] = this.myAccession;
        if (this.specFromParent != null && this.specFromParent.length > 0)
            moreParams['spec'] = this.specFromParent;
        if (this.pageSizeFromParent != null && this.pageSizeFromParent > 0)
            moreParams['pgS'] = this.pageSizeFromParent;
        if (this.currentPageFromParent != null && this.currentPageFromParent > 0)
            moreParams['pg'] = this.currentPageFromParent;
        if (this.queryFromParent != null && this.queryFromParent.length > 0)
            moreParams['q'] = GlobalState.cleanedRouterParameter(this.queryFromParent);
        if (this.searchJustLastNameFlagFromParent != null) {
            if (this.searchJustLastNameFlagFromParent)
                moreParams['ln'] = "1";
            else
                moreParams['ln'] = "0";
        }
        if (this.searchJustPreferredNameFlagFromParent != null) {
            if (this.searchJustPreferredNameFlagFromParent)
                moreParams['pn'] = "1";
            else
                moreParams['pn'] = "0";
        }
        if (this.searchFieldSortOrderSpecifierFromParent != null)
            moreParams['so'] = this.searchFieldSortOrderSpecifierFromParent;

        if (this.reduceToBornThisTimeFlagFromParent != null) {
            if (this.reduceToBornThisTimeFlagFromParent)
                moreParams['bt'] = "1";
            else
                moreParams['bt'] = "0";
        }
        this.router.navigate(['/all', moreParams]);
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

    private EstablishFavoritesBlock(givenFavs: BiographyFavorites) {
        var candidate: string;

        this.ClearFavoritesBlock(); // have favorites empty unless we get valid content

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

    toggleAddToPlaylist(story) {
        this.playlistManagerService.toggleAddToPlaylist(story);
    }
}
