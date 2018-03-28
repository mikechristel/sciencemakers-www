import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import {Location} from '@angular/common';

import { ActivatedRoute, Router, Params } from '@angular/router';
import { BriefBio } from '../historymakers/brief-bio';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TitleManagerService } from '../title-manager.service';
import { Story } from './story';
import { StorySetType} from './storyset-type';
import { TextSearchService } from '../text-search/text-search.service';
import { IDSearchService } from '../id-search/id-search.service';
import { MenuService } from '../menu/menu.service';
import { PlaylistManagerService } from '../playlist-manager/playlist-manager.service'
import { DragulaService } from 'ng2-dragula/ng2-dragula';
import { SearchableFacetSpecifier } from './searchable-facet-specifier';
import { SearchResult } from './search-result';
import { StorySearchSortField } from './story-search-sort-field';

import { AppConfig } from '../config/app-config';
import { Facet } from '../historymakers/facet';
import { FacetDetail } from '../historymakers/facet-detail';
import { GlobalState } from '../app.global-state';
import { Playlist } from '../shared/playlist/playlist';

@Component({
    selector: 'my-storyset',
    templateUrl: './storyset.component.html',
    styleUrls: ['./storyset.component.scss']
})
export class StorySetComponent implements OnInit {

    cardView: boolean = true;
    mobileFiltersOpen: boolean = false;
    myID: number;
    myFullNameAddOn: string;
    myCurrentQuery: string;
    myCurrentSearchTitleOnlyFlag: boolean;
    myCurrentSearchTranscriptOnlyFlag: boolean;
    myCurrentSearchParentBiographyID: number;
    myCurrentInterviewYearRangeFilter: string;
    myCurrentPage: number;
    myCurrentPageSize: number;
    titleForStorySet: string;
    totalStoriesFound: string;
    myStoryList: Story[];

    txtQuery: string = ""; // this is the query string as edited by the user, perhaps not the same as the one already executed to show query results (which is in myCurrentQuery)

    myType: StorySetType = StorySetType.None; // gets assigned in ngOnInit via router params

    pages: number[] = [];
    needPrevPage: boolean = false;
    needNextPage: boolean = false;
    needToggleDetails: boolean = false;

    // NOTE:  terminology has not been updated in the code: the UI will make note of a specific saved set of stories as "My Playlist" while code here
    // still notes this as "Starred Stories" -- despite the UI changing from star to plus to add a story to the playlist.  Take note: starred means "my playlist."
    showingStarredSet: boolean = false; // needed to gate extra UI for starred stories, i.e., my playlist marked set of stories
    starredIDList: string = null; // gates additional UI for starred stories, *IF* there is at least one starred story

    playlist: Playlist[];

    toggleDetailsLabel: string;

    selectedStoryID: number; // ID of the story, if any, that is selected in the story list

    // NOTE: REVISIT THIS BECAUSE WE HAVE ASSUMPTIONS HERE ON EXACTLY 3 FACET GROUPS IN PARTICULAR FORMS.  MVC works for facets, but are not coded for extensibility at this point!!!
    // TODO:  Also, code here and within historymakers.component.ts (for biographies rather than stories) very similar: perhaps create a facet panel component to use in both.
    genderFacets: FacetDetail[] = [];
    birthyearFacets: FacetDetail[] = [];
    jobTypeFacets: FacetDetail[] = [];

    activeGenderFacets: Facet[] = [];
    activeJobFacets: Facet[] = [];
    activeBirthyearFacets: Facet[] = [];

    // TODO: Later consider whether to have each story set type (starred, etc.) in its own component,
    // inheriting perhaps the base story set features of paging, titling, etc.  For now, all story sets except biography story sets
    // are here in this code base.

    givenIDList: string = "";
    IDListTitle: string;
    filteredPlaylistLength: number;

    // Sorting
    storySearchSortFields: StorySearchSortField[];
    myCurrentStorySearchSorting: number; // indicator on the sorting in use

    minYearAllowed: number;

    constructor(private config: AppConfig,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private historyMakerService: HistoryMakerService,
        private textSearchService: TextSearchService,
        private idSearchService: IDSearchService,
        private titleManagerService: TitleManagerService,
        private menuService: MenuService,
        private dragulaService: DragulaService,
        private playlistManagerService: PlaylistManagerService) {
        this.titleForStorySet = "HistoryMaker Stories";
        dragulaService.setOptions('tapesTarget', {
            moves: (el, source, handle, sibling) => !el.classList.contains('ignore-item'),
            direction: 'horizontal'
        });
        dragulaService.dropModel.subscribe((value) => {
            playlistManagerService.updatePlaylist();
        });
        this.minYearAllowed = config.getEarliestInterviewYear();
    }

    // Here is the definitive list for routing based on story set type:
    // (For all types:  type for type, pg for page, pgS for page size, sID for selected story ID (what to highlight/page into view, if anything).)
    // ---
    // StorySetType.BiographyCollection: (formerly here, but now moved to its own component, biography-storyset)
    // ---
    // StorySetType.StarredSet:
    // Needed:  A cached list of starred stories in a global state (see playlistManagerService).
    // ---
    // StorySetType.StarredSetWithGivenIDs:
    // Needed:  Comma-separated ID list as parameter IDList required to be cached as the list of starred stories in a global state (see playlistManagerService).
    // ---
    // StorySetType.GivenIDSet:
    // Needed:  Comma-separated ID list as parameter IDList required.
    // ---
    // StorySetType.UnsupportedStorySetType: (a slot for a type not supported in this particular corpus interface)
    // ---
    // StorySetType.TextSearch:
    // Needed: q for query.
    // ---
    // StorySetType.TagSearch:
    // Ignored (not enough tagged data in this corpus to support a proper tag search, AKA topic search).
    ngOnInit() {

        // NOTE: this lead-in code will NOT be called if only the arguments change for the page /stories/args --
        // This is confirmed with: https://github.com/angular/angular/issues/11835
        // So, rather than have the code do work before the Observable is set up via this.route.params.forEach, instead have all the work
        // be done in the observable.  That way, if the code later calls itself (component reload on say a parameter change) the
        // code within this.route.params.forEach() will fire, while if we had "blah; this.route.params.forEach(...)" the blah would not.
        this.setStorySearchSortFieldOptions();
        this.menuService.setSearchOption('story');
        this.myCurrentStorySearchSorting = GlobalState.StorySearchSortingPreference;
        this.playlist = this.playlistManagerService.initializePlaylist();
        this.route.params.forEach((params: Params) => {
            var proposedSelectedStoryID: number; // it will only be "proposed" until a story set is resolved; then it can be acted on....
            var titlePiece: string;
            var givenPageIndicator: number;
            var givenPageSize: number;
            var searchStoryTitleOnlyFlag: boolean = GlobalState.SearchTitleOnly;
            var searchStoryTranscriptOnlyFlag: boolean = GlobalState.SearchTranscriptOnly;
            var filterSpecToUse: string = "";
            var interviewYearFilterToUse: string = "";

            this.titleForStorySet = ""; // updated depending on this.mType in code below
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            this.showingStarredSet = false;
            this.starredIDList = null;

            this.myType = params['type']; // e.g., StorySetType.TextSearch for text query, etc.
            // Across all types, there is an optional story ID, sID, parameter to indicate which story to select in the list:
            if (params['sID'] !== undefined)
                proposedSelectedStoryID = +params['sID'];
            // Support paging across all types as well:
            if (params['pgS'] !== undefined)
                givenPageSize = +params['pgS'];
            else
                givenPageSize = GlobalState.SearchPageSize;
            // Also support facet filtering:
            // NOTE:  specification for filtering may be null
            if (params['spec'] !== undefined) {
                filterSpecToUse = params['spec'];
            }

            // Also allow additional interview year filtering (which may be empty, i.e., not used)
            if (params['iy'] !== undefined) {
                interviewYearFilterToUse = params['iy'];
            }

            if (params['pg'] !== undefined)
                givenPageIndicator = +params['pg'];
            else
                givenPageIndicator = 1; // first page == 1

            if (params['so'] !== undefined  && !isNaN(+params['so'])) {
                var candidateSortOrder:number = +params['so'];
                if (candidateSortOrder >= 0 && candidateSortOrder < this.storySearchSortFields.length) {
                    this.setStorySearchSorting(candidateSortOrder);
                }
            }

            this.needToggleDetails = false;

            if (this.myType == StorySetType.StarredSet || this.myType == StorySetType.GivenIDSet ||
              this.myType == StorySetType.StarredSetWithGivenIDs) {
                this.starredIDList = null; // set to contents iff there is at least one starred story
                this.showingStarredSet = (this.myType == StorySetType.StarredSet || this.myType == StorySetType.StarredSetWithGivenIDs);
                // If this.showingStarredSet, then ID list is via global cache.
                // Else, ID list is via parameter IDList.
                var IDListToLoad: string;
                if (this.showingStarredSet) {
                    if (this.myType == StorySetType.StarredSet)
                        IDListToLoad = this.playlistManagerService.PlaylistAsString();
                    else { // For StarredSetWithGivenIDs, try to get from parameter; else get from service.
                        if (params['IDList'] !== undefined) {
                            IDListToLoad = params['IDList'];
                        }
                        else
                            IDListToLoad = this.playlistManagerService.PlaylistAsString();
                    }
                    if (IDListToLoad !== "") this.location.replaceState(this.playlistManagerService.PlaylistAsPath());
                }
                else {
                    if (params['IDList'] !== undefined) {
                        IDListToLoad = params['IDList'];
                    }
                    else
                        IDListToLoad = "";
                    this.givenIDList = IDListToLoad;
                }
                if (params['ListTitle'] !== undefined)
                    this.IDListTitle = decodeURIComponent(params['ListTitle']);
                // NOTE: for empty ID list, logic exists within getIDListStoriesPage to report "none yet" message;
                // it makes use of this.showingStarredSet:
                this.getIDListStoriesPage(IDListToLoad, givenPageIndicator, givenPageSize, filterSpecToUse, proposedSelectedStoryID);

            }
            else if (this.myType == StorySetType.TextSearch) {
                if (params['sT'] !== undefined)
                    searchStoryTitleOnlyFlag = (params['sT'] == "1");
                if (params['sS'] !== undefined)
                    searchStoryTranscriptOnlyFlag = (params['sS'] == "1");
                // Set search context arguments to match was is in parameters line
                this.myCurrentSearchTitleOnlyFlag = searchStoryTitleOnlyFlag;
                this.myCurrentSearchTranscriptOnlyFlag = searchStoryTranscriptOnlyFlag;
                this.myCurrentSearchParentBiographyID = GlobalState.NOTHING_CHOSEN;
                this.myCurrentInterviewYearRangeFilter = interviewYearFilterToUse;

                // NOTE:  q is expected
                if (params['q'] !== undefined) {
                    this.titleForStorySet = "Searching... (in progress)";
                    this.myCurrentQuery = params['q'];

                    // TODO: Decide if further routing or interface support is needed when a search within stories of a given person is done.
                    // It may be enough to see only results from one person to cue in what happened, so for now no other interface titling/cues are used.
                    if (params['ip'] !== undefined && !isNaN(+params['ip'])) {
                        // Do a search "inside of a person" i.e., just that person's stories can be returned.
                        var personToLimitResults: number = +params['ip'];
                        this.myCurrentSearchParentBiographyID = personToLimitResults;
                        this.getTextSearchResultsPage(givenPageIndicator, givenPageSize, filterSpecToUse, proposedSelectedStoryID);
                    }
                    else
                        this.getTextSearchResultsPage(givenPageIndicator, givenPageSize, filterSpecToUse, proposedSelectedStoryID);
                }
                else {
                    this.myCurrentQuery = null;
                    this.setInterfaceForEmptyStorySet(givenPageSize, "");
                }
            }
        });
    }

    ngOnDestroy():void {
        if (!!this.dragulaService.find('tapesTarget')) {
            this.dragulaService.destroy('tapesTarget');
        }
    }

    private getIDListStoriesPage(IDListToLoad: string, givenPage: number, givenPageSize: number, filterSpecToUse: string, proposedSelectedStoryID: number) {
        // NOTE: assumes this.showingStarredSet is true iff id list is to be considered a "starred" set.
        if (IDListToLoad.length > 0) {
            this.titleForStorySet = "Searching... (in progress)";
            var titleLabelStoryModifier: string = "";

            var searchableFacetSpec: SearchableFacetSpecifier = this.computeFacetArguments(filterSpecToUse);
            if (this.nonEmptyFacetSpecification(searchableFacetSpec))
                titleLabelStoryModifier = "filtered ";

            this.idSearchService.getIDSearch(IDListToLoad, givenPage, givenPageSize,
                searchableFacetSpec.genderFacetSpec, searchableFacetSpec.birthyearFacetSpec, searchableFacetSpec.makerFacetSpec, searchableFacetSpec.jobFacetSpec)
                .then(retSet => {
                    GlobalState.matchSetContext = null; // no match terms for matching on story IDs
                    this.myStoryList = retSet.stories;
                    var totalCount: number;
                    if (this.myStoryList != null) {
                        totalCount = retSet.count;
                        // If proposedSelectedStoryID is null, this clears out selected story ID; else it sets it:
                        this.selectedStoryID = proposedSelectedStoryID;
                        this.calcTitleAndEnablePaging(givenPage, givenPageSize, totalCount, titleLabelStoryModifier, "");

                        if (this.showingStarredSet && totalCount > 0)
                            this.starredIDList = "IDList=" + this.playlistManagerService.PlaylistAsString();

                        this.initiateFacetInterface(searchableFacetSpec, retSet);
                    }
                    else {
                        this.selectedStoryID = null; // no stories to select
                        this.setInterfaceForEmptyStorySet(givenPageSize, "No " + titleLabelStoryModifier + " stories yet.");
                    }
                })
                .catch(reason => { // give up, perhaps because no starred stories were specified
                    this.setInterfaceForEmptyStorySet(givenPageSize, "No " + titleLabelStoryModifier + " stories yet.");
                });
        }
        else {
            var msg: string;
            if (this.showingStarredSet)
                msg = "There are no stories in my playlist yet.";
            else
                msg = "No story IDs were given, so no stories shown."
            this.setInterfaceForEmptyStorySet(givenPageSize, msg);
        }
    }

    private computeFacetArguments(filterSpecToUse: string): SearchableFacetSpecifier {
        // Very specific helper function, where given argument is a dash-separated four value list if not empty
        // for gender, maker, job, and birthyear facet specifications.  If given argument does not parse as such or is empty,
        // return an empty SearchableFacetSpecifier with all fields set to "".
        var retVal: SearchableFacetSpecifier = new SearchableFacetSpecifier();
        retVal.genderFacetSpec = ""; // default each individual spec to empty
        retVal.makerFacetSpec = "";
        retVal.jobFacetSpec = "";
        retVal.birthyearFacetSpec = "";

        if (filterSpecToUse.length > 0) {
            var filterPieces: string[] = filterSpecToUse.split("-");
            if (filterPieces.length == 4) {
                retVal.genderFacetSpec = filterPieces[0];
                retVal.makerFacetSpec = filterPieces[1];
                retVal.jobFacetSpec = filterPieces[2];
                retVal.birthyearFacetSpec = filterPieces[3];
            }
        }
        return retVal;
    }

    private getTextSearchResultsPage(givenPage: number, givenPageSize: number, filterSpecToUse: string, proposedSelectedStoryID: number) {
        // NOTE:  assumes range for givenPage is legal: [1, maxPagesNeeded].
        // Assumes myCurrentQuery are set appropriately to do the query as expected.
        // Also, myCurrentSearchTitleOnlyFlag and myCurrentSearchTranscriptOnlyFlag and myCurrentSearchParentBiographyID
        // and myCurrentInterviewYearRangeFilter.
        var titleLabelStoryModifier: string = "";
        var titleLabelSuffix: string = "";
        var searchableFacetSpec: SearchableFacetSpecifier = this.computeFacetArguments(filterSpecToUse);
        if (this.nonEmptyFacetSpecification(searchableFacetSpec))
            titleLabelStoryModifier = "filtered";
        this.IDListTitle = null;

        // TODO: wire up sort field and sort order to interfaces.
        var sortField:string = ""; // empty string will result in no sort field being used
        var sortInDescendingOrder: boolean = false; // actually will be ignored with an empty sortField

        if (GlobalState.StorySearchSortingPreference >= 0 && GlobalState.StorySearchSortingPreference < this.storySearchSortFields.length) {
            sortField = this.storySearchSortFields[GlobalState.StorySearchSortingPreference].sortField;
            sortInDescendingOrder = this.storySearchSortFields[GlobalState.StorySearchSortingPreference].sortInDescendingOrder;
        }

        this.textSearchService.getTextSearch(this.myCurrentQuery, this.myCurrentInterviewYearRangeFilter,this.myCurrentSearchParentBiographyID,
            this.myCurrentSearchTitleOnlyFlag, this.myCurrentSearchTranscriptOnlyFlag, givenPage, givenPageSize,
            searchableFacetSpec.genderFacetSpec, searchableFacetSpec.birthyearFacetSpec,
            searchableFacetSpec.makerFacetSpec, searchableFacetSpec.jobFacetSpec, sortField, sortInDescendingOrder)
          .then(retSet => {
            GlobalState.matchSetContext = retSet; // others may check for scoring terms, match character offsets to scoring terms, etc.
            this.myStoryList = retSet.stories;
            var totalCount: number;
            if (this.myStoryList != null) {
                totalCount = retSet.count;
                // If proposedSelectedStoryID is null, this clears out selected story ID; else it sets it:
                this.selectedStoryID = proposedSelectedStoryID;
            }
            else {
                this.selectedStoryID = null; // no stories to select
                totalCount = 0;
            }

            if (this.myCurrentQuery != null && this.myCurrentQuery.length > 0 && this.myCurrentQuery != "*") {
                if (this.myCurrentInterviewYearRangeFilter != null) {
                    var readableDateRange: string = this.readableStringForInterviewYearRange();
                    if (readableDateRange.length > 0)
                      titleLabelSuffix += " interviewed " + readableDateRange; // date range made sense, so use it
                }
                titleLabelSuffix += " matching";
                if (this.myCurrentSearchTitleOnlyFlag)
                    titleLabelSuffix += " in title";
                else if (this.myCurrentSearchTranscriptOnlyFlag)
                    titleLabelSuffix += " in transcript";

                if (this.myCurrentSearchParentBiographyID != GlobalState.NOTHING_CHOSEN)
                    titleLabelSuffix += " within one person";
                titleLabelSuffix += ": " + this.myCurrentQuery;
            }

            this.calcTitleAndEnablePaging(givenPage, givenPageSize, totalCount, titleLabelStoryModifier, titleLabelSuffix);

            this.initiateFacetInterface(searchableFacetSpec, retSet);
          })
          .catch(reason => {
              if (reason && reason.length && reason.length > 0)
                  this.setInterfaceForEmptyStorySet(givenPageSize, "No stories found due to error: " + reason);
              else
                  this.setInterfaceForEmptyStorySet(givenPageSize, "");
        });
    }

    private readableStringForInterviewYearRange(): string {
        // Use this.myCurrentInterviewYearRangeFilter to determine a readable interview date range.  If not possible, return "".
        var retVal: string = "";
        if (this.myCurrentInterviewYearRangeFilter.length == 9 && this.myCurrentInterviewYearRangeFilter[4] == "-") {
            // Have xxxx-xxxx as expected.  If each xxxx parses to a valid date, output an appropriate string.
            var earlyYear: number = 0;
            var lateYear: number = 0;
            var workString: string = this.myCurrentInterviewYearRangeFilter.substring(0, 4);
            if (!isNaN(+workString)) {
                earlyYear = +workString;
                workString = this.myCurrentInterviewYearRangeFilter.substring(5, 9);
                if (!isNaN(+workString)) {
                    lateYear = +workString;
                    if (lateYear == earlyYear)
                        retVal = "in " + earlyYear;
                    else {
                        if (earlyYear > this.minYearAllowed) {
                            // NOTE:  We invest one call, new Data().getYear(), to pretty up the display of the interview date range.
                            var currentYear: number = new Date().getFullYear();
                            if (lateYear == currentYear)
                                retVal = "in or after " + earlyYear;
                            else
                                retVal = "between " + earlyYear + " and " + lateYear;
                        }
                        else
                            retVal = "in or before " + lateYear;
                    }
                }
            }
        }

        return retVal;
    }

    private nonEmptyFacetSpecification(givenFacetSpecifier: SearchableFacetSpecifier): boolean {
        // NOTE: this version of the corpus does nothing with the makerFacet, so simply ignore givenFacetSpec.makerFacetSpec.
        return (givenFacetSpecifier != null && (givenFacetSpecifier.genderFacetSpec.length > 0 ||
              givenFacetSpecifier.jobFacetSpec.length > 0|| givenFacetSpecifier.birthyearFacetSpec.length > 0))
    }

    private initiateFacetInterface(givenFacetSpec: SearchableFacetSpecifier, resultSet: SearchResult) {
        this.genderFacets = [];
        this.jobTypeFacets = [];
        this.birthyearFacets = [];
        this.activeGenderFacets = [];
        this.activeJobFacets = [];
        this.activeBirthyearFacets = [];
        var oneFacet: FacetDetail;
        // Handle gender:
        var genderIDsInFilter: string[] = givenFacetSpec.genderFacetSpec.split(",");
        for (var i = 0; i < resultSet.facets.gender.length; i++) {
            if (resultSet.facets.gender[i].value == "F") {
                oneFacet = new FacetDetail();
                oneFacet.value = GlobalState.FEMALE_MARKER;
                oneFacet.ID = GlobalState.FEMALE_ID;
                oneFacet.count = resultSet.facets.gender[i].count;
                if (genderIDsInFilter[0] === "F") oneFacet.active = true;
                this.genderFacets.push(oneFacet);
            }
            else if (resultSet.facets.gender[i].value == "M") {
                oneFacet = new FacetDetail();
                oneFacet.value = GlobalState.MALE_MARKER;
                oneFacet.ID = GlobalState.MALE_ID;
                oneFacet.count = resultSet.facets.gender[i].count;
                if (genderIDsInFilter[0] === "M") oneFacet.active = true;
                this.genderFacets.push(oneFacet);
            }
        }

        // NOTE: this version of the corpus does nothing with the makerFacet, so simply ignore givenFacetSpec.makerFacetSpec.

        // Handle job type:
        var jobIDsInFilter: string[] = givenFacetSpec.jobFacetSpec.split(",");
        for (i = 0; i < resultSet.facets.occupationTypes.length; i++) {
            oneFacet = new FacetDetail();
            oneFacet.ID = +resultSet.facets.occupationTypes[i].value; // ID is the numeric value
            oneFacet.count = resultSet.facets.occupationTypes[i].count;
            oneFacet.value = this.historyMakerService.getJobType(oneFacet.ID); // value is the readable string
            if (jobIDsInFilter.indexOf(oneFacet.ID.toString()) !== -1) oneFacet.active = true;
            this.jobTypeFacets.push(oneFacet);
        }
        // Handle birthyear:
        var birthyearsInFilter: string[] = givenFacetSpec.birthyearFacetSpec.split(",");
        for (i = 0; i < resultSet.facets.birthYear.length; i++) {
            oneFacet = new FacetDetail();
            oneFacet.ID = +resultSet.facets.birthYear[i].value; // ID is the numeric value
            oneFacet.count = resultSet.facets.birthYear[i].count;
            oneFacet.value = resultSet.facets.birthYear[i].value + "s"; // value is the year value with "s" at end to convey a decade, e.g., 1950s for 1950 value
            if (birthyearsInFilter.indexOf(oneFacet.ID.toString()) !== -1) oneFacet.active = true;
            this.birthyearFacets.push(oneFacet);
        }

        if (this.nonEmptyFacetSpecification(givenFacetSpec))
            this.updateActiveFacetsToMatchFilter(givenFacetSpec.genderFacetSpec, givenFacetSpec.makerFacetSpec, givenFacetSpec.jobFacetSpec, givenFacetSpec.birthyearFacetSpec);
    }

    // Set interface for empty results.  If no improvedTitle is given, use "No stories found." as the title.
    private setInterfaceForEmptyStorySet(givenPageSize: number, improvedTitle: string) {
        this.myStoryList = [];
        if (improvedTitle == null || improvedTitle.length == 0)
            this.titleForStorySet = "No stories found.";
        else
            this.titleForStorySet = improvedTitle;
        this.titleManagerService.setTitle(GlobalState.EMPTY_STORY_SET_TITLE);

        this.selectedStoryID = null; // no stories to select
        this.needToggleDetails = false;

        this.myCurrentPage = 1;
        this.myCurrentPageSize = givenPageSize;
        this.SetPagingInterface(false, false);
    }

    // Set the page title based on given parameters.
    // Also cache the page information in myCurrentPage and myCurrentPageSize.
    private calcTitleAndEnablePaging(givenPage: number, givenPageSize: number, totalCount: number,
          extraAdjectiveForStories: string, suffixForTitleEnd: string) {
        this.myCurrentPage = givenPage;
        this.myCurrentPageSize = givenPageSize;
        var titleLabelPrefix: string = "";
        var modifierForStories: string;
        var modifierForPlaylist: string = "";
        var totalPages: number = Math.ceil(totalCount / givenPageSize);

        if (totalCount <= 0) {
            this.pages = [];
        }

        // Provide numbers for pagination
        else if (totalPages <= 10 || givenPage <= 6){
            this.pages = [];
            for(let i = 1; i < 10; i++) {
                if (i <= totalPages) {
                    this.pages.push(i);
                }
            }
        }

        else {
            // paginate 1 backward
            if(givenPage <= this.pages[5] && this.pages[0] !== 1) {
                this.pages = this.pages.map( function(value) {
                    return value - 1;
                } );
            }
            // paginate 1 forward
            else if(givenPage >= this.pages[6] && this.pages.indexOf(totalPages) === -1) {
                this.pages = this.pages.map( function(value) {
                    return value + 1;
                } );
            }
            else {
                this.pages = [];
                if(givenPage + 8 >= totalPages) {
                    for(let i = totalPages; i > totalPages - 8; i--) {
                        this.pages.unshift(i);
                    }
                    // Removes values of 0 or below from pages array
                    this.pages = this.pages.filter(function(x){ return x > 0 });
                }
                else {
                    for(let i = givenPage; i < givenPage + 8; i++) {
                        if (i !== totalPages) {
                            this.pages.push(i);
                        }
                    }
                }
            }
        }

        if (extraAdjectiveForStories == null || extraAdjectiveForStories.length == 0)
            modifierForStories = "";
        else
            modifierForStories = extraAdjectiveForStories + " "; // add space separator at end, e.g., if adjective is starred, later we get starred stories, etc.
        if (this.showingStarredSet) {
            modifierForPlaylist = " in playlist";
        }

        // NOTE: Depending on this.myType and this.showingStarredSet, this.totalStoriesFound will be of the form "X Stories" or "X Stories Found" or "X Stories in Playlist"
        var storiesTotalSuffix: string = ""; // default (as when an ID list is given) to no extra suffix, i.e., just X Stories
        if (this.myType == StorySetType.TextSearch || this.myType == StorySetType.BiographyCollection)
            storiesTotalSuffix = " Found";
        else if (this.showingStarredSet)
            storiesTotalSuffix = " in Playlist";
        if (totalCount == 0) {
            if (givenPage != 1) {
                this.titleForStorySet = "No " + modifierForStories + "stories for page " + givenPage + " (" + givenPageSize + " stories per page)" + suffixForTitleEnd;;
                this.SetPagingInterface(true, false);
            }
            else {
                this.totalStoriesFound = totalCount.toLocaleString() + " Stories" + storiesTotalSuffix;
                this.filteredPlaylistLength = totalCount;
                this.titleForStorySet = "No " + modifierForStories + "stories found" + suffixForTitleEnd;
                this.SetPagingInterface(false, false);
            }
        }
        else {
            var totalCountDescription: string = "";
            totalCountDescription += totalCount;
            if (totalCount > givenPage * givenPageSize) { // not on last page of a result set needing paging
                titleLabelPrefix = "Page " + givenPage + " (" + givenPageSize + " per page) of " + totalCountDescription + " " + modifierForStories + "stories";
                this.SetPagingInterface((givenPage > 1), true);
            }
            else {
                // Perhaps everything fits on first page (count > page size).  If so, don't list Page 1 (... and drop any "Over"
                // prefix since "everything fits on the first page."
                if (givenPage == 1) {
                    if (totalCount == 1) {
                        titleLabelPrefix = totalCount + " " + modifierForStories + "story" + modifierForPlaylist;
                        this.filteredPlaylistLength = totalCount;
                    }
                    else {
                        titleLabelPrefix = totalCount + " " + modifierForStories + "stories" + modifierForPlaylist;
                        this.filteredPlaylistLength = totalCount;
                    }
                }
                else // everything does NOT fit on last page of results, but it is true that there is no next page.  Show Page N (....
                    titleLabelPrefix = "Page " + givenPage + " (" + givenPageSize + " per page) of " + totalCountDescription + " " + modifierForStories + "stories";
                this.SetPagingInterface((givenPage > 1), false);
            }
            this.titleForStorySet = titleLabelPrefix + suffixForTitleEnd;

            if (totalCount === 1) this.totalStoriesFound = totalCount.toLocaleString() + " Story" + storiesTotalSuffix;
            else this.totalStoriesFound = totalCount.toLocaleString() + " Stories" + storiesTotalSuffix;
        }
        // NOTE: At users' request, keeping browser title short and simple rather than including paging details.
        // So, rather than setTitle(this.titleForStorySet), still use this.titleForStorySet perhaps in html page, but
        // have a short generic title instead.
        this.titleManagerService.setTitle("The ScienceMakers, Story Set");
    }

    private updateActiveFacetsToMatchFilter(genderFacetSpec: string, makerFacetSpec: string, jobFacetSpec: string, birthyearFacetSpec: string) {
        // Update activeGenderFacets, activeJobFacets, activeBirthyearFacets to match what is given via filterSpecInPlay
        this.activeGenderFacets = [];
        this.activeJobFacets = [];
        this.activeBirthyearFacets = [];
        var oneFacet: Facet;
        var i: number;
        var itemInCSVList: string[];
        var j: number;
        var valueToUse: string;
        var IDToCheck: number;

        if (genderFacetSpec != null && genderFacetSpec.length == 1) {
            if (genderFacetSpec == "M") {
                oneFacet = new Facet();
                oneFacet.ID = GlobalState.MALE_ID;
                oneFacet.value = GlobalState.MALE_MARKER;
                this.activeGenderFacets.push(oneFacet);
            }
            else if (genderFacetSpec == "F") {
                oneFacet = new Facet();
                oneFacet.ID = GlobalState.FEMALE_ID;
                oneFacet.value = GlobalState.FEMALE_MARKER;
                this.activeGenderFacets.push(oneFacet);
            }
        }

        // NOTE: this version of the corpus does nothing with maker facets, so simply ignore makerFacetSpec.

        if (jobFacetSpec != null) {
            itemInCSVList = jobFacetSpec.split(",");
            for (i = 0; i < itemInCSVList.length; i++) {
                IDToCheck = +itemInCSVList[i];
                valueToUse = "";
                for (j = 0; j < this.jobTypeFacets.length; j++) {
                    if (this.jobTypeFacets[j].ID == IDToCheck) {
                        valueToUse = this.jobTypeFacets[j].value;
                        break;
                    }
                }
                if (valueToUse != "") {
                    oneFacet = new Facet();
                    oneFacet.ID = IDToCheck;
                    oneFacet.value = valueToUse;
                    this.activeJobFacets.push(oneFacet);
                }
            }
        }
        if (birthyearFacetSpec != null) {
            itemInCSVList = birthyearFacetSpec.split(",");
            for (i = 0; i < itemInCSVList.length; i++) {
                IDToCheck = +itemInCSVList[i];
                valueToUse = "";
                for (j = 0; j < this.birthyearFacets.length; j++) {
                    if (this.birthyearFacets[j].ID == IDToCheck) {
                        valueToUse = this.birthyearFacets[j].value;
                        break;
                    }
                }
                if (valueToUse != "") {
                    oneFacet = new Facet();
                    oneFacet.ID = IDToCheck;
                    oneFacet.value = valueToUse;
                    this.activeBirthyearFacets.push(oneFacet);
                }
            }
        }
    }

    private SetPagingInterface(goBackPageOK: boolean, goFwdPageOK: boolean) {
        this.needPrevPage = goBackPageOK;
        this.needNextPage = goFwdPageOK;
    }

    handleStarredSetRemoval(storyIDForRemoval: number) {
        var index = GlobalState.myStarredStoriesList.indexOf(storyIDForRemoval, 0);
        if (index > -1) {
            GlobalState.myStarredStoriesList.splice(index, 1);
            this.routeToStarredStoriesIDList(this.playlistManagerService.PlaylistAsString());
        }
    }

    private navigationParametersForContext(typeParameterNeeded: boolean, currentPageIndicatorNeeded: boolean): any[] {
        var moreParams = [];

        // Based on this.myType and other context variables, set parameters used for routing/navigation.
        if (this.myType != null) {
            if (typeParameterNeeded)
                moreParams['type'] = this.myType;
            // else it is represented in the router path already and need not be a parameter as well

            // Take care of some typical arguments first like page, page size, etc.
            if (this.myCurrentPageSize != null && this.myCurrentPageSize > 0)
                moreParams['pgS'] = this.myCurrentPageSize;
            if (currentPageIndicatorNeeded) {
                if (this.myCurrentPage != null && this.myCurrentPage > 0)
                    moreParams['pg'] = this.myCurrentPage;
            }
            var filterSpecInPlay: string = this.specStringFromActiveFacets();
            if (filterSpecInPlay.length > 0)
                moreParams['spec'] = filterSpecInPlay;

            // !!!TBD!!! TODO: revisit this code and similar routing "wiring up" in story.component.ts and elsewhere, to reduce details known across all component pages.
            if (this.myType == StorySetType.TextSearch) {
                if (this.myCurrentQuery != null) {
                    moreParams['q'] = GlobalState.cleanedRouterParameter(this.myCurrentQuery);
                    if (this.myCurrentSearchTitleOnlyFlag)
                        moreParams['sT'] = "1";
                    else
                        moreParams['sT'] = "0";
                    if (this.myCurrentSearchTranscriptOnlyFlag)
                        moreParams['sS'] = "1";
                    else
                        moreParams['sS'] = "0";
                    if (this.myCurrentSearchParentBiographyID != GlobalState.NOTHING_CHOSEN)
                        moreParams['ip'] = this.myCurrentSearchParentBiographyID;
                    if (this.myCurrentStorySearchSorting)
                        moreParams['so'] = this.myCurrentStorySearchSorting
                    if (this.myCurrentInterviewYearRangeFilter != null && this.myCurrentInterviewYearRangeFilter.length > 0)
                        moreParams['iy'] = this.myCurrentInterviewYearRangeFilter;
                }
            }
            else if (this.myType == StorySetType.GivenIDSet) {
                if (this.givenIDList.length > 0)
                    moreParams['IDList'] = this.givenIDList;
            }
            // NOTE: for this.myType == StorySetType.StarredSet, make use of GlobalState.myStarredStoriesList to restore the starred set.
        }
        return moreParams;
    }

    private setOptionsAndRouteToStoryPage(storyID: number) {
        // NOTE: Story ID is *REQUIRED* and so is part of router.navigate path below (along with /story) rather than in moreQueryParams.

        // Pass along enough detail to land back here on this page if the destination page issues a "go back" page request;
        // take care of some typical arguments first like page, page size, etc.
        var moreQueryParams = this.navigationParametersForContext(true, true);

        this.router.navigate(['/story', storyID, moreQueryParams]);
    }

    private setStorySearchSortFieldOptions() {
        var listOfSortFields = [];
        listOfSortFields.push(new StorySearchSortField(0, "Relevance", "", false, (GlobalState.StorySearchSortingPreference == 0)));
        listOfSortFields.push(new StorySearchSortField(1, "Oldest Interview", "interviewDate", false, (GlobalState.StorySearchSortingPreference == 1)));
        listOfSortFields.push(new StorySearchSortField(2, "Latest Interview", "interviewDate", true, (GlobalState.StorySearchSortingPreference == 2)));
        this.storySearchSortFields = listOfSortFields;
    }

    setStorySearchSorting(newSortingPreference: number) {
        this.myCurrentStorySearchSorting = newSortingPreference;
        if (GlobalState.StorySearchSortingPreference >= 0 && GlobalState.StorySearchSortingPreference < this.storySearchSortFields.length) {
            // There was a prior valid sorting preference, so clear it.
            this.storySearchSortFields[GlobalState.StorySearchSortingPreference].selected = false;
        }
        GlobalState.StorySearchSortingPreference = newSortingPreference;
        this.storySearchSortFields[newSortingPreference].selected = true;
    }

    setStorySearchSortingAndDoTheSort(newSortingPreference: number) {
        this.setStorySearchSorting(newSortingPreference); // set the new sorting state
        this.routeToPage(this.myType, 1); // go to first page of "new" page of results (hence the updating of GlobalState.StorySearchSortingPreference first right before routeToPage)
    }


    doSearch() {
        // Actions are similar to routeToPage() except that a new query is loaded via txtQuery,
        // and "in progress" title can note that a new query is being fetched.
        this.selectedStoryID = null;
        var moreOptions = {};

        this.titleForStorySet = "Searching... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
        // Accumulate routing parameters specifying filter specification, page information, etc.
        if (this.txtQuery != null && this.txtQuery.length > 0)
            moreOptions['q'] = GlobalState.cleanedRouterParameter(this.txtQuery);
        moreOptions['pg'] = 1; // always show page 1 of new query
        moreOptions['pgS'] = GlobalState.SearchPageSize; // use global context page size

        // NOTE: any filters (i.e., active facets) are cleared away on a new search.

        this.router.navigate(['/stories', StorySetType.TextSearch, moreOptions]);
    }

    noNeedForSearch(): boolean { // Returns true iff there is no need for search action (no search query).
        return (this.txtQuery == null || this.txtQuery.length == 0);
    }

    onSelected(oneStoryID: number) {
        this.selectedStoryID = oneStoryID;

        this.setOptionsAndRouteToStoryPage(this.selectedStoryID);
    }

    setPageSize(newSize: number) {
        if (GlobalState.SearchPageSize != newSize) {
            GlobalState.SearchPageSize = newSize;
            // NOTE: using same page-allowed? checks used in goBackPage and goFwdPage:
            if (this.myCurrentQuery != null) {
                this.myCurrentPageSize = newSize;
                this.routeToPage(this.myType, 1); // go to first page of "new" page of results (hence the updating of myCurrentPageSize above)
            }
        }
    }

    goBackPage() {
        if (this.myCurrentQuery != null && this.myCurrentPage > 1) {
            this.routeToPage(this.myType, this.myCurrentPage - 1);
        }
    }

    goFwdPage() {
        // NOTE: trusting that the code which sets needNextPage will do so only when there is a next page,
        // i.e., when this.myCurrentPage + 1 makes sense for the given query.
        if (this.myCurrentQuery != null) {
            this.routeToPage(this.myType, this.myCurrentPage + 1);
        }
    }

    goToPage(pageVal) {
        this.routeToPage(this.myType, pageVal);
    }

    private routeToStarredStoriesIDList(IDListAsString: string) {
        this.selectedStoryID = null;
        var moreOptions = {};

        moreOptions['pendingIDList'] = IDListAsString; // NOTE: router will show different data in the IDList parameter so that browser will have different address,
                                                // but in actuality pendingIDList is NOT used; the global cache of starred stories is used instead for StorySetType.StarredSet.
        this.router.navigate(['/stories', StorySetType.StarredSet, moreOptions]);
    }

    private routeToPage(storySetTypeIndicator: StorySetType, newPageIdentifier: number) {
        this.selectedStoryID = null;
        var moreOptions = this.navigationParametersForContext(false, false);
        // Add to whatever we have in moreOptions by giving the new page identifier:
        moreOptions['pg'] = newPageIdentifier;
        this.titleForStorySet = "Fetching Page " + newPageIdentifier + "... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);

        this.router.navigate(['/stories', storySetTypeIndicator, moreOptions]);
    }

    private specStringFromActiveFacets(): string {
        var filterSpec: string = "";
        var makerFacetSpec: string = ""; // NOTE: this will remain empty.
        var jobFacetSpec: string = "";
        var birthyearFacetSpec: string = "";

        var i: number;

        if (this.activeGenderFacets.length == 1) {
            if (this.activeGenderFacets[0].ID == GlobalState.FEMALE_ID)
                filterSpec = "F";
            else if (this.activeGenderFacets[0].ID == GlobalState.MALE_ID)
                filterSpec = "M";
        }
        filterSpec += "-";
        for (i = 0; i < this.activeJobFacets.length; i++) {
            jobFacetSpec = jobFacetSpec + this.activeJobFacets[i].ID + ",";
        }
        for (i = 0; i < this.activeBirthyearFacets.length; i++) {
            birthyearFacetSpec = birthyearFacetSpec + this.activeBirthyearFacets[i].ID + ",";
        }
        // Take off extraneous ending commas:
        if (jobFacetSpec.length > 0)
            jobFacetSpec = jobFacetSpec.substring(0, jobFacetSpec.length - 1);
        if (birthyearFacetSpec.length > 0)
            birthyearFacetSpec = birthyearFacetSpec.substring(0, birthyearFacetSpec.length - 1);

        filterSpec += makerFacetSpec + "-" + jobFacetSpec + "-" + birthyearFacetSpec; // NOTE: it is OK to have makerFacetSpec remain empty.
        return filterSpec;
    }

    clearGenderFacet(facetToClear: number, facetValueToClear: string) {
        // NOTE: Not trusting that gender ID of MALE_ID or FEMALE_ID might not collide with "real" facet IDs - hence activeGenderFacets is separate and confirmed with facetValueToClear
        var facetCleared: boolean = false;

       for (var i = 0; i < this.activeGenderFacets.length; i++) {
            if (facetToClear == this.activeGenderFacets[i].ID) {
                if (facetValueToClear == GlobalState.FEMALE_MARKER || facetValueToClear == GlobalState.MALE_MARKER) {
                    // Accept this MALE_ID or FEMALE_ID value in facetToClear as pertaining to gender.  Continue with the clearing of it...
                    this.activeGenderFacets.splice(i, 1);
                    facetCleared = true;
                    break;
                }
            }
        }
        if (facetCleared) {
            this.processClearedFilter();
        }
    }

    clearJobFacet(facetToClear: number) {
        var facetCleared: boolean = false;

        for (var i = 0; i < this.activeJobFacets.length; i++) {
            if (facetToClear == this.activeJobFacets[i].ID) {
                this.activeJobFacets.splice(i, 1);
                facetCleared = true;
                break;
            }
        }
        if (facetCleared) {
            this.processClearedFilter();
        }
    }

    clearBirthyearFacet(facetToClear: number) {
        var facetCleared: boolean = false;
        for (var i = 0; i < this.activeBirthyearFacets.length; i++) {
            if (facetToClear == this.activeBirthyearFacets[i].ID) {
                this.activeBirthyearFacets.splice(i, 1);
                facetCleared = true;
                break;
            }
        }
        if (facetCleared) {
            this.processClearedFilter();
        }
    }

    chooseGenderFacet(chosenFacetID: number, chosenFacetValue: string) {
        var itemAlreadyChosen: boolean = false;

        for (var i = 0; i < this.activeGenderFacets.length; i++) {
            if (this.activeGenderFacets[i].ID == chosenFacetID) {
                itemAlreadyChosen = true;
                break;
            }
        }
        if (!itemAlreadyChosen) {
            var oneFacet: Facet = new Facet();
            oneFacet.ID = chosenFacetID;
            oneFacet.value = chosenFacetValue;
            this.activeGenderFacets.push(oneFacet);
            this.processUpdatedFilter();
        }
    }

    chooseJobFacet(chosenFacetID: number, chosenFacetValue: string) {
        var itemAlreadyChosen: boolean = false;

        for (var i = 0; i < this.activeJobFacets.length; i++) {
            if (this.activeJobFacets[i].ID == chosenFacetID) {
                itemAlreadyChosen = true;
                break;
            }
        }
        if (!itemAlreadyChosen) {
            var oneFacet: Facet = new Facet();
            oneFacet.ID = chosenFacetID;
            oneFacet.value = chosenFacetValue;
            this.activeJobFacets.push(oneFacet);
            this.processUpdatedFilter();
        }
    }

    chooseBirthyearFacet(chosenFacetID: number, chosenFacetValue: string) {
        var itemAlreadyChosen: boolean = false;

        for (var i = 0; i < this.activeBirthyearFacets.length; i++) {
            if (this.activeBirthyearFacets[i].ID == chosenFacetID) {
                itemAlreadyChosen = true;
                break;
            }
        }
        if (!itemAlreadyChosen) {
            var oneFacet: Facet = new Facet();
            oneFacet.ID = chosenFacetID;
            oneFacet.value = chosenFacetValue;
            this.activeBirthyearFacets.push(oneFacet);
            this.processUpdatedFilter();
        }
    }

    clearFilters() {
        this.activeBirthyearFacets = [];
        this.activeJobFacets = [];
        this.activeGenderFacets = [];
        this.setStorySearchSorting(0);
        this.setPageSize(30);
        this.processUpdatedFilter();
    }

    activeFacet(facet) {
        facet.active = true;

        return facet;
    }

    private processClearedFilter() {
        var storySetTypeIndicator: StorySetType;
        if (this.activeGenderFacets.length > 0 || this.activeJobFacets.length > 0 || this.activeBirthyearFacets.length > 0) {
            this.titleForStorySet = "Fetching Filtered Page 1... (in progress)";
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
            // Fold in filter spec, too, which will happen with call to this.specStringFromActiveFacets() within this.routeToPage().
        }
        else {
            // Special case: we just removed the last remaining filter, i.e., there are no filters left.
            this.titleForStorySet = "Fetching Page 1... (in progress)";
            this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
        }
        this.routeToPage(this.myType, 1); // proceed to page 1 of the newly filtered set
    }

    private processUpdatedFilter() {
        // Do the filtering by calling this.routeToPage() which will compute this.specStringFromActiveFacets(), returning to page 1 of the newly filtered set:
        this.titleForStorySet = "Fetching Filtered Page 1... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_STORY_SET_TITLE);
        // Accumulate routing parameters specifying filter specification, page information, etc.
        this.routeToPage(this.myType, 1); // proceed to page 1 of the newly filtered set
    }

    toggleMobileFilters() {
        this.mobileFiltersOpen ? this.mobileFiltersOpen = false : this.mobileFiltersOpen = true;
    }

    toggleAddToPlaylist(story) {
        this.playlistManagerService.toggleAddToPlaylist(story);
    }
}
