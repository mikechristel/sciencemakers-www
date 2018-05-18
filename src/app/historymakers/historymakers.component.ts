import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';

import { TableOfContents } from './table-of-contents';
import { BriefBio } from './brief-bio';
import { HistoryMakerService } from './historymaker.service';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { TitleManagerService } from '../title-manager.service';
import { MenuService } from '../menu/menu.service';
import { Facet } from './facet';
import { Facets } from './facets';
import { FacetDetail } from './facet-detail';
import { StorySetType} from '../storyset/storyset-type';
import { GlobalState } from '../app.global-state';
import { BiographyStampComponent } from '../biography-stamp/biography-stamp.component';
import { BiographySearchSortField } from './biography-search-sort-field';

@Component({
    selector: 'my-historymakers',
    templateUrl: './historymakers.component.html',
    styleUrls: ['./historymakers.component.scss']
})

export class HistoryMakersComponent implements OnInit {
    biographySetTitle: string;
    totalBiographiesFound: string;
    showingAllHistoryMakers: boolean;
    biographies: BriefBio[];

    needPrevPage: boolean = false;
    needNextPage: boolean = false;
    pages: number[] = [];

    textQuery: string = ""; // this is the biography query string as edited by the user, perhaps not the same as the one already executed to show query results (which is in myCurrentQuery)
    searchLastNameOnly: boolean;
    searchPreferredNameOnly: boolean;
    fields: string[] = ['chosen fields','last name','preferred name'];
    searchByField: string;
    subscription: Subscription;

    bioResultsPageSize: number;
    myCurrentPageSize: number;

    myCurrentBiographySearchSorting: number; // indicator on the sorting in use
    bioSearchSortFields: BiographySearchSortField[];

    mobileFiltersOpen: boolean = false;

    cardView: boolean = true;

    // NOTE: REVISIT THIS BECAUSE WE HAVE ASSUMPTIONS HERE ON EXACTLY 4 USED FACET GROUPS IN PARTICULAR FORMS.  MVC works for facets, but are not coded for extensibility at this point!!!
    // TODO:  Also, code here and within storyset.component.ts (for stories rather than biographies) very similar: perhaps create a facet panel component to use in both.
    // NOTE: facet groups are not the same for biographies and stories: with biographies there is a lastInitial facet.
    genderFacets: FacetDetail[] = [];
    jobTypeFacets: FacetDetail[] = [];
    yearFacets: FacetDetail[] = [];
    lastInitialFacets: FacetDetail[] = [];

    activeGenderFacets: Facet[] = [];
    activeJobFacets: Facet[] = [];
    activeYearFacets: Facet[] = [];
    activeLastInitialFacets: Facet[] = [];

    private selectedBiographyID: string = GlobalState.NO_ACCESSION_CHOSEN;
    private myCurrentPage: number;
    private myCurrentQuery: string;
    private myCurrentSearchLastNameOnlyFlag: boolean;
    private myCurrentSearchPreferredNameOnlyFlag: boolean;
    private myBornThisTimeFilterFlag: boolean;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private historyMakerService: HistoryMakerService,
        private titleManagerService: TitleManagerService,
        private menuService: MenuService) {

        this.biographySetTitle = "The HistoryMakers";
    }

    private setBiographySearchSortFieldOptions() {
        var listOfSortFields = [];
        listOfSortFields.push(new BiographySearchSortField(0, "Relevance", "", false, (GlobalState.BiographySearchSortingPreference == 0)));
        listOfSortFields.push(new BiographySearchSortField(1, "Last Name A-Z", "lastName", false, (GlobalState.BiographySearchSortingPreference == 1)));
        listOfSortFields.push(new BiographySearchSortField(2, "Last Name Z-A", "lastName", true, (GlobalState.BiographySearchSortingPreference == 2)));
        listOfSortFields.push(new BiographySearchSortField(3, "Oldest First", "birthDate", false, (GlobalState.BiographySearchSortingPreference == 3)));
        listOfSortFields.push(new BiographySearchSortField(4, "Youngest First", "birthDate", true, (GlobalState.BiographySearchSortingPreference == 4)));
        this.bioSearchSortFields = listOfSortFields;
    }

    ngOnInit() {
        this.subscription = this.menuService.performSearch$.subscribe((value) => {
            this.textQuery = value;
            this.doBiographySearch();
        });
        this.menuService.setSearchOption('bio');
        this.searchLastNameOnly = GlobalState.BiographySearchLastNameOnly;
        this.searchPreferredNameOnly = GlobalState.BiographySearchPreferredNameOnly;
        this.setField();
        this.setBiographySearchSortFieldOptions();
        this.myCurrentBiographySearchSorting = GlobalState.BiographySearchSortingPreference;

        this.route.params.forEach((params: Params) => {
            var givenPageSize: number = GlobalState.BiographyPageSize;
            var givenPageIndicator: number = 1;
            var searchLastNameOnlyFlag: boolean = GlobalState.BiographySearchLastNameOnly;
            var searchPreferredNameOnlyFlag: boolean = GlobalState.BiographySearchPreferredNameOnly;
            this.myBornThisTimeFilterFlag = false;

            if (params['ID'] !== undefined) {
                this.selectedBiographyID = params['ID'];
            }
            else
                this.selectedBiographyID = GlobalState.NO_ACCESSION_CHOSEN;

            if (params['pgS'] !== undefined) {
                var candidatePageSize = +params['pgS'];
                if (candidatePageSize != null && candidatePageSize > 0)
                    givenPageSize = candidatePageSize;
            }
            if (params['pg'] !== undefined) {
                var candidatePageIndicator = +params['pg'];
                if (candidatePageIndicator != null && candidatePageIndicator > 0)
                    givenPageIndicator = candidatePageIndicator; // 1-based indicator used, so first page is at page 1
            }
            this.bioResultsPageSize = givenPageSize;

            // NOTE: need to document meaning of parameters as we are getting a parameter explosion with increased capabilities and client requests,
            // e.g., 'ln' signal search just the last name field, 'pn' just preferred name field, so signals search field sorting order,
            // bt signals a filter to those born this time as in day or week, etc.
            // A better design:  routing with less parameters, or a better way to deal with the "pass throughs" that are only there to allow a "back" in-page navigation item.
            // Much simplification is possible if we back away from in-page "go back" options and rely on browser back button to go back to prior "page".

            // If we have bt, we ignore q, ln, etc., as we do not issue a query, just a filter to those "born this time":
            if (params['bt'] != undefined && params['bt'] == "1") {
                this.myBornThisTimeFilterFlag = true;
                this.myCurrentQuery = null;
            }
            else {
                if (params['q'] !== undefined) {
                    this.myCurrentQuery = params['q'];
                    if (this.myCurrentQuery.trim().length == 0)
                      this.myCurrentQuery = null; // up front throw out an all-whitespace query as a non-query
                }
                else
                    this.myCurrentQuery = null;
                if (params['ln'] !== undefined)
                    searchLastNameOnlyFlag = (params['ln'] == "1");
                if (params['pn'] !== undefined)
                    searchPreferredNameOnlyFlag = (params['pn'] == "1");

                if (params['so'] !== undefined  && !isNaN(+params['so'])) {
                    var candidateSortOrder:number = +params['so'];
                    if (candidateSortOrder >= 0 && candidateSortOrder < this.bioSearchSortFields.length) {
                        this.setBioSearchSorting(candidateSortOrder);
                    }
                }
            }
            // Set biography search context arguments to match what is in processed parameters
            this.searchLastNameOnly = searchLastNameOnlyFlag;
            this.myCurrentSearchLastNameOnlyFlag = searchLastNameOnlyFlag;
            this.searchPreferredNameOnly = searchPreferredNameOnlyFlag;
            this.myCurrentSearchPreferredNameOnlyFlag = searchPreferredNameOnlyFlag;

            // NOTE:  specification for filtering may be null
            if (params['spec'] !== undefined) {
                this.getHistoryMakers(givenPageIndicator, givenPageSize, params['spec']);
            }
            else
                this.getHistoryMakers(givenPageIndicator, givenPageSize, "");

        });
    }

    getHistoryMakers(givenPage: number, givenPageSize: number, filterSpecToUse: string) {
        // NOTE:  assumes range for givenPage is legal: [1, maxPagesNeeded] and that
        //  myCurrentQuery is set appropriately for a query, or cleared for no query

        var titleLabelSuffix: string = "";
        var genderFacetSpec: string = "";
        var jobFacetSpec: string = "";
        var yearFacetSpec: string = "";
        var lastInitialFacetSpec: string = "";
        var i: number;

        if (filterSpecToUse.length > 0) {
            var filterPieces: string[] = filterSpecToUse.split("-");
            if (filterPieces.length == 5) {
                genderFacetSpec = filterPieces[0];
                // NOTE: "Maker" facets in next slot are not used in this interface but a dash is kept in place: makerFacetSpec = filterPieces[1];
				// The reason to keep the extraneous "-" is to allow search and filter URLs from a larger corpus to still work here (ignoring the "Maker" facet if given).
				// Code below dealing with "-" will add an extra one before job facet to hold the place for makerFacet.
                jobFacetSpec = filterPieces[2];
                yearFacetSpec = filterPieces[3];
                lastInitialFacetSpec = filterPieces[4];
                if (genderFacetSpec.length > 0 || jobFacetSpec.length > 0 || yearFacetSpec.length > 0 || lastInitialFacetSpec.length > 0)
                    titleLabelSuffix = " filtered";
            }
        }
        titleLabelSuffix += " ScienceMaker";

        // Wire up sort field and sort order to interfaces based on GlobalState.BiographySearchSortingPreference and this.bioSearchSortFields.
        // NOTE: these are NOT used with getHistoryMakersBornThisDay (or BornThisMonth) service.
        var sortField:string = ""; // empty string will result in service's default sort field being used
        var sortInDescendingOrder: boolean = false; // actually will be ignored with an empty sortField
        if (GlobalState.BiographySearchSortingPreference >= 0 && GlobalState.BiographySearchSortingPreference < this.bioSearchSortFields.length) {
            sortField = this.bioSearchSortFields[GlobalState.BiographySearchSortingPreference].sortField;
            sortInDescendingOrder = this.bioSearchSortFields[GlobalState.BiographySearchSortingPreference].sortInDescendingOrder;
        }

        var emptyMakerFacetSpec: string = ""; // NOTE: this version of the corpus does not support maker facets

        if (this.myBornThisTimeFilterFlag) {
            this.historyMakerService.getHistoryMakersBornThisMonth(givenPage, givenPageSize, genderFacetSpec, yearFacetSpec, emptyMakerFacetSpec, jobFacetSpec, lastInitialFacetSpec).subscribe(retSet => {
                this.myCurrentPage = givenPage;
                this.myCurrentPageSize = givenPageSize;
                this.biographies = retSet.biographies;
                this.initializeTitleAndPaging(givenPage, givenPageSize, retSet.count, titleLabelSuffix);
                this.processFacetsFromService(retSet.facets, genderFacetSpec, jobFacetSpec, yearFacetSpec, lastInitialFacetSpec);
            });
        }
        else {
            this.historyMakerService.getHistoryMakers(this.myCurrentQuery, this.myCurrentSearchLastNameOnlyFlag, this.myCurrentSearchPreferredNameOnlyFlag,
              givenPage, givenPageSize, genderFacetSpec, yearFacetSpec, emptyMakerFacetSpec, jobFacetSpec, lastInitialFacetSpec, sortField, sortInDescendingOrder).subscribe(retSet => {
                this.myCurrentPage = givenPage;
                this.myCurrentPageSize = givenPageSize;
                this.biographies = retSet.biographies;
                this.initializeTitleAndPaging(givenPage, givenPageSize, retSet.count, titleLabelSuffix);
                this.processFacetsFromService(retSet.facets, genderFacetSpec, jobFacetSpec, yearFacetSpec, lastInitialFacetSpec);
            });
        }
    }

    private initializeTitleAndPaging(givenPage: number, givenPageSize: number, totalCount: number,
      titleLabelSuffixSoFar: string) {
        // Helper function during initial load of contents.
        // Assumptions: this.myCurrentQuery and this.myBornThisTimeFilterFlag already set.
        var countReturned: number;
        var titleLabelSuffix: string = titleLabelSuffixSoFar;
        var shortBrowserPageTitle: string;
        var totalPages: number = Math.ceil(totalCount / givenPageSize);
        // For some sets, have total be X HistoryMakers Found; for others, just X HistoryMakers
        var addFoundSuffixToTotalSummary: boolean = false;
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

        if (this.biographies != null && this.biographies.length > 0)
            countReturned = this.biographies.length;
        else
            countReturned = 0;

        if (countReturned != 1)
            titleLabelSuffix += "s"; // e.g., "0 HistoryMakers" or "23 HistoryMakers"
        if (this.myBornThisTimeFilterFlag) {
            titleLabelSuffix += " born this month"; // NOTE: here we assume "time" is a "month" rather than "this week" or "this day", i.e., service call getHistoryMakersBornThisMonth used
            addFoundSuffixToTotalSummary = true; // for born this time period, tack on a " Found" to this.totalBiographiesFound
        }
        else if (this.myCurrentQuery != null && this.myCurrentQuery.length > 0 && this.myCurrentQuery != "*") {
            // decorate the title based on search parameters cached in the object state: this.myCurrentQuery, etc.
            titleLabelSuffix += " matching";
            if (this.myCurrentSearchLastNameOnlyFlag) {
                titleLabelSuffix += " last name";
            }
            else if (this.myCurrentSearchPreferredNameOnlyFlag) {
                titleLabelSuffix += " preferred name";
            }
            titleLabelSuffix += ": " + this.myCurrentQuery;
            addFoundSuffixToTotalSummary = true; // for any given query, tack on a " Found" to this.totalBiographiesFound
        }

        if (countReturned > 0) {
            if (totalCount > givenPage * givenPageSize) {

                this.biographySetTitle = "Page " + givenPage + ", (" + givenPageSize + " per page), of " + totalCount + titleLabelSuffix;
                this.SetPagingInterface((givenPage > 1), true);
            } else {
                // Perhaps everything fits on first page (count > page size).  If so, don't list Page 1 (...
                if (givenPage == 1)
                    this.biographySetTitle = totalCount + titleLabelSuffix;
                else // everything does NOT fit on last page of results, but it is true that there is no next page.  Show Page N (....
                    this.biographySetTitle = "Page " + givenPage + " (" + givenPageSize + " per page) of " + totalCount + titleLabelSuffix;
                this.SetPagingInterface((givenPage > 1), false);
            }
        }
        else { // No stories, perhaps because caller asked for page 1000 of result set that only has 20 pages....
            if (givenPage != 1) {
                this.biographySetTitle = "No ScienceMakers for page " + givenPage + " (" + givenPageSize + " per page)";
                this.SetPagingInterface(true, false);
            }
            else {
                if (this.myBornThisTimeFilterFlag)
                    this.biographySetTitle = "No ScienceMakers born this month."; // NOTE: here we assume "time" is a "month" rather than "this week" or "this day"
                else
                    this.biographySetTitle = "No results for " + titleLabelSuffix;
                this.SetPagingInterface(false, false);
            }
        }
        if (totalCount == 1)
            this.totalBiographiesFound = "1 ScienceMaker";
        else
            this.totalBiographiesFound = totalCount.toLocaleString() + " ScienceMakers";
        if (addFoundSuffixToTotalSummary)
            this.totalBiographiesFound += " Found";
        else // make clear this set is the "total" rather than some subset of found items
            this.totalBiographiesFound += " Total";
        // At users' suggestion, title the page in browser with a shorter name without paging details:
        if (this.myBornThisTimeFilterFlag)
            shortBrowserPageTitle = "ScienceMakers Born this Month"; // NOTE: here we assume "time" is a "month" rather than "this week" or "this day"
        else
            shortBrowserPageTitle = "ScienceMakers Biographies Set";
        this.titleManagerService.setTitle(shortBrowserPageTitle);
    }

    private processFacetsFromService(returnedFacets: Facets, genderFacetSpec: string, jobFacetSpec: string, yearFacetSpec: string, lastInitialFacetSpec: string) {
        var i: number;

        this.genderFacets = [];
        this.jobTypeFacets = [];
        this.yearFacets = [];
        this.lastInitialFacets = [];

        this.activeGenderFacets = [];
        this.activeJobFacets = [];
        this.activeYearFacets = [];
        this.activeLastInitialFacets = [];

        var oneFacet: FacetDetail;
        // Handle gender; be picky and allow only one gender in genderFacetSpec, "F" or "M", to be recognized:
        for (i = 0; i < returnedFacets.gender.length; i++) {
            if (returnedFacets.gender[i].value == "F") {
                oneFacet = new FacetDetail();
                oneFacet.value = GlobalState.FEMALE_MARKER;
                oneFacet.ID = GlobalState.FEMALE_ID;
                oneFacet.count = returnedFacets.gender[i].count;
                if (genderFacetSpec == "F") oneFacet.active = true;
                this.genderFacets.push(oneFacet);
            }
            else if (returnedFacets.gender[i].value == "M") {
                oneFacet = new FacetDetail();
                oneFacet.value = GlobalState.MALE_MARKER;
                oneFacet.ID = GlobalState.MALE_ID;
                oneFacet.count = returnedFacets.gender[i].count;
                if (genderFacetSpec == "M") oneFacet.active = true;
                this.genderFacets.push(oneFacet);
            }
        }

        // Handle last initial; be picky and allow only one upper case letter in lastInitialFacetSpec, e.g., "A" or "C", to be recognized:
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('');
        var unsortedLastInitialFacets: FacetDetail[] = [];
        var candidateID: number;
        for (i = 0; i < returnedFacets.lastInitial.length; i++) {
            candidateID = alphabet.indexOf(returnedFacets.lastInitial[i].value); // ID is 0 for A, 1 for B, etc.
            if (candidateID >= 0) {
                oneFacet = new FacetDetail();
                oneFacet.ID = candidateID; // ID is 0 for A, 1 for B, etc.
                oneFacet.count = returnedFacets.lastInitial[i].count;
                oneFacet.value = returnedFacets.lastInitial[i].value; // value is given in returnedFacets as upper case single letter initial ABCD...
                if (lastInitialFacetSpec == oneFacet.value) oneFacet.active = true;
                unsortedLastInitialFacets.push(oneFacet);
            }
        }
        // Sort unsortedLastInitialFacets before assigning to this.lastInitialFacets alphabetically as well.
        // (The count is de-emphasized for this particular facet in favor of the value with the sorted value getting prominence.)
        this.lastInitialFacets = unsortedLastInitialFacets.sort((a: FacetDetail, b: FacetDetail) => {
            if (a.ID < b.ID) {
                return -1;
            } else if (a.ID > b.ID) {
                return 1;
            } else {
                return 0;
            }
        });

        // Handle job type:
        var jobIDsInFilter: string[] = jobFacetSpec.split(",");
        for (i = 0; i < returnedFacets.occupationTypes.length; i++) {
            oneFacet = new FacetDetail();
            oneFacet.ID = +returnedFacets.occupationTypes[i].value; // ID is the numeric value
            oneFacet.count = returnedFacets.occupationTypes[i].count;
            oneFacet.value = this.historyMakerService.getJobType(oneFacet.ID); // value is the readable string
            if (jobIDsInFilter.indexOf(oneFacet.ID.toString()) !== -1) oneFacet.active = true;
            this.jobTypeFacets.push(oneFacet);
        }
        // Handle year (which is really a decade ten-year marker):
        var decadeValuesInFilter: string[] = yearFacetSpec.split(",");
        for (i = 0; i < returnedFacets.birthYear.length; i++) {
            oneFacet = new FacetDetail();
            oneFacet.ID = +returnedFacets.birthYear[i].value; // ID is the numeric value
            oneFacet.count = returnedFacets.birthYear[i].count;
            oneFacet.value = returnedFacets.birthYear[i].value + "s"; // value is the string form of the numeric value followed by "s", e.g., 1950s for 1950
            if (decadeValuesInFilter.indexOf(oneFacet.ID.toString()) !== -1) oneFacet.active = true;
            this.yearFacets.push(oneFacet);
        }

        if (genderFacetSpec.length > 0 || jobFacetSpec.length > 0 || yearFacetSpec.length > 0 || lastInitialFacetSpec.length > 0)
            this.updateActiveFacetsToMatchFilter(genderFacetSpec, jobFacetSpec, yearFacetSpec, lastInitialFacetSpec);
    }

    private updateActiveFacetsToMatchFilter(genderFacetSpec: string, jobFacetSpec: string, yearFacetSpec: string, lastInitialFacetSpec: string) {
        // Update activeGenderFacets, activeJobFacets, activeYearFacets, activeLastInitialFacets to match the specification from the input parameters to this function.
        this.activeGenderFacets = [];
        this.activeJobFacets = [];
        this.activeYearFacets = [];
        this.activeLastInitialFacets = [];

        var oneFacet: Facet;
        var i: number;
        var itemInCSVList: string[];
        var j: number;
        var valueToUse: string;
        var IDToCheck: number;

        // NOTE: Be picky: allow only a single gender facet specification:
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

        // NOTE: Be picky: allow only a single last initial facet specification:
        if (lastInitialFacetSpec != null && lastInitialFacetSpec.length == 1) {
            const alphabet = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase().split('');
            var legalInitialID = alphabet.indexOf(lastInitialFacetSpec); // ID is 0 for A, 1 for B, etc., with -1 for not being in upper case range of [A,Z]
            if (legalInitialID >= 0) {
                oneFacet = new Facet();
                oneFacet.ID = legalInitialID;
                oneFacet.value = lastInitialFacetSpec;
                this.activeLastInitialFacets.push(oneFacet);
            }
        }

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

        if (yearFacetSpec != null) {
            itemInCSVList = yearFacetSpec.split(",");
            for (i = 0; i < itemInCSVList.length; i++) {
                IDToCheck = +itemInCSVList[i];
                valueToUse = "";
                for (j = 0; j < this.yearFacets.length; j++) {
                    if (this.yearFacets[j].ID == IDToCheck) {
                        valueToUse = this.yearFacets[j].value;
                        break;
                    }
                }
                if (valueToUse != "") {
                    oneFacet = new Facet();
                    oneFacet.ID = IDToCheck;
                    oneFacet.value = valueToUse;
                    this.activeYearFacets.push(oneFacet);
                }
            }
        }
    }

    private setOptionsAndRouteToPage(overrideToBornThisTime: boolean, queryToUse: string, pageToLoad: number, pageSize: number,
      searchLastNameOnlyFlag: boolean, searchPreferredNameOnlyFlag: boolean, sortOrderSpecifier: number, filterSpecInPlay: string) {
        var moreOptions = [];
        // Accumulate routing parameters specifying filter specification, page information, etc.

        if (overrideToBornThisTime) {
            // NOTE: "born this time" always trumps the query specification and is used in its place
            moreOptions['bt'] = "1";
        }
        else {
            if (queryToUse != null && queryToUse.length > 0)
                moreOptions['q'] = GlobalState.cleanedRouterParameter(queryToUse);
            if (searchLastNameOnlyFlag)
                moreOptions['ln'] = "1"; // search just the last name field
            else
                moreOptions['ln'] = "0";
            if (searchPreferredNameOnlyFlag)
                moreOptions['pn'] = "1"; // search just the preferred name field
            else
                moreOptions['pn'] = "0";
            moreOptions['so'] = sortOrderSpecifier;
        }
        moreOptions['pg'] = pageToLoad;
        moreOptions['pgS'] = pageSize;
        if (filterSpecInPlay.length > 0) {
            moreOptions['spec'] = filterSpecInPlay; // NOTE assumption that filter spec has no "special" characters, i.e., it does not need to be cleaned via GlobalState.cleanedRouterParameter()
        }
        this.router.navigate(['/all', moreOptions]);
    }

    onSelected(bio: BriefBio) {
        this.selectedBiographyID = bio.document.accession;

        // NOTE: ID is *REQUIRED* and so is part of link parameters array (along with /detail) rather than in optional data like spec.
        // The optional data allows a "go back" operation to be easily made (go back to source page filtered appropriately).
        // To note that the page, page size, and filter spec is from a PARENT page, preface with p: ppg, ppgS, pspec....
        var moreNavigationParams = {};
        moreNavigationParams['ID'] = bio.document.accession;
        if (this.myBornThisTimeFilterFlag)
            moreNavigationParams['bt'] = "1";
        moreNavigationParams['ppg'] = this.myCurrentPage;
        moreNavigationParams['ppgS'] = this.myCurrentPageSize;
        if (this.myCurrentQuery != null)
            moreNavigationParams['q'] = GlobalState.cleanedRouterParameter(this.myCurrentQuery);
        if (this.myCurrentSearchLastNameOnlyFlag != null) {
            if (this.myCurrentSearchLastNameOnlyFlag)
                moreNavigationParams['ln'] = "1";
            else
                moreNavigationParams['ln'] = "0";
        }
        if (this.myCurrentSearchPreferredNameOnlyFlag != null) {
            if (this.myCurrentSearchPreferredNameOnlyFlag)
                moreNavigationParams['pn'] = "1";
            else
                moreNavigationParams['pn'] = "0";
        }
        moreNavigationParams['so'] = this.myCurrentBiographySearchSorting;
        var filterSpecInPlay: string = this.specStringFromActiveFacets();
        if (filterSpecInPlay.length > 0) {
            moreNavigationParams['pspec'] = filterSpecInPlay;
        }
        this.router.navigate(['/storiesForBio', moreNavigationParams]);
    }

    private SetPagingInterface(goBackPageOK: boolean, goFwdPageOK: boolean) {
        this.needPrevPage = goBackPageOK;
        this.needNextPage = goFwdPageOK;
    }

    goBackPage() {
        if (this.needPrevPage)
            this.routeToPage(this.myCurrentPage - 1);
    }

    goFwdPage() {
        if (this.needNextPage)
            this.routeToPage(this.myCurrentPage + 1);
    }

    goToPage(pageVal) {
        this.routeToPage(pageVal);
    }

    private routeToPage(newPageIdentifier: number) {
        this.selectedBiographyID = GlobalState.NO_ACCESSION_CHOSEN;

        this.biographySetTitle = "Fetching Page " + newPageIdentifier + "... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_SCIENCEMAKERS_SET_TITLE);
        // Accumulate routing parameters specifying filter specification, page information, etc.
        this.setOptionsAndRouteToPage(this.myBornThisTimeFilterFlag, this.myCurrentQuery, newPageIdentifier, this.myCurrentPageSize,
            this.myCurrentSearchLastNameOnlyFlag, this.myCurrentSearchPreferredNameOnlyFlag, this.myCurrentBiographySearchSorting, this.specStringFromActiveFacets());
    }

    private specStringFromActiveFacets(): string {
        var filterSpec: string = "";
        var jobFacetSpec: string = "";
        var yearFacetSpec: string = "";
        var lastInitialSpec: string = "";
        var i: number;

        if (this.activeGenderFacets.length == 1) {
            if (this.activeGenderFacets[0].ID == GlobalState.FEMALE_ID)
                filterSpec = "F";
            else if (this.activeGenderFacets[0].ID == GlobalState.MALE_ID)
                filterSpec = "M";
        }
        if (this.activeLastInitialFacets.length == 1) {
            lastInitialSpec = this.activeLastInitialFacets[0].value;
        }
        filterSpec += "-";
        for (i = 0; i < this.activeJobFacets.length; i++) {
            jobFacetSpec = jobFacetSpec + this.activeJobFacets[i].ID + ",";
        }
        for (i = 0; i < this.activeYearFacets.length; i++) {
            yearFacetSpec = yearFacetSpec + this.activeYearFacets[i].ID + ",";
        }
        // Take off extraneous ending commas:
        if(jobFacetSpec.length > 0)
            jobFacetSpec = jobFacetSpec.substring(0, jobFacetSpec.length - 1);
        if(yearFacetSpec.length > 0)
            yearFacetSpec = yearFacetSpec.substring(0, yearFacetSpec.length - 1);

        filterSpec += "-" + jobFacetSpec + "-" + yearFacetSpec + "-" + lastInitialSpec; // NOTE: extra - before job facet is intentional
        return filterSpec;
    }

    clearGenderFacet(facetToClear: number, facetValueToClear: string) {
        // Note: Not trusting that gender ID of MALE_ID, FEMALE_ID might not collide with "real" facet IDs - hence activeGenderFacets is separate and confirmed with facetValueToClear
        var facetCleared: boolean = false;

        for (var i = 0; i < this.activeGenderFacets.length; i++) {
            if (facetToClear == this.activeGenderFacets[i].ID) {
                if (facetValueToClear == GlobalState.FEMALE_MARKER || facetValueToClear == GlobalState.MALE_MARKER) {
                    // Accept this MALE_ID, FEMALE_ID value as pertaining to gender.  Continue with the clearing of it...
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

    clearYearFacet(facetToClear: number) {
        var facetCleared: boolean = false;

        for (var i = 0; i < this.activeYearFacets.length; i++) {
            if (facetToClear == this.activeYearFacets[i].ID) {
                this.activeYearFacets.splice(i, 1);
                facetCleared = true;
                break;
            }
        }
        if (facetCleared) {
            this.processClearedFilter();
        }
    }

    clearLastInitialFacet(facetToClear: number) {
        var facetCleared: boolean = false;

        for (var i = 0; i < this.activeLastInitialFacets.length; i++) {
            if (facetToClear == this.activeLastInitialFacets[i].ID) {
                this.activeLastInitialFacets.splice(i, 1);
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
                this.clearGenderFacet(chosenFacetID, chosenFacetValue);
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
                this.clearJobFacet(chosenFacetID);
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

    chooseYearFacet(chosenFacetID: number, chosenFacetValue: string) {
        var itemAlreadyChosen: boolean = false;

        for (var i = 0; i < this.activeYearFacets.length; i++) {
            if (this.activeYearFacets[i].ID == chosenFacetID) {
                itemAlreadyChosen = true;
                this.clearYearFacet(chosenFacetID);
                break;
            }
        }
        if (!itemAlreadyChosen) {
            var oneFacet: Facet = new Facet();
            oneFacet.ID = chosenFacetID;
            oneFacet.value = chosenFacetValue;
            this.activeYearFacets.push(oneFacet);
            this.processUpdatedFilter();
        }
    }

    chooseLastInitialFacet(chosenFacetID: number, chosenFacetValue: string) {
        var itemAlreadyChosen: boolean = false;

        for (var i = 0; i < this.activeLastInitialFacets.length; i++) {
            if (this.activeLastInitialFacets[i].ID === chosenFacetID) {
                itemAlreadyChosen = true;
                this.clearLastInitialFacet(chosenFacetID);
                break;
            }
        }
        if (!itemAlreadyChosen) {
            var oneFacet: Facet = new Facet();
            oneFacet.ID = chosenFacetID;
            oneFacet.value = chosenFacetValue;
            this.activeLastInitialFacets.push(oneFacet);
            this.processUpdatedFilter();
        }
    }

    activeFacet(facet) {
        facet.active = true;

        return facet;
    }

    clearFilters() {
        this.activeLastInitialFacets = [];
        this.activeYearFacets = [];
        this.activeJobFacets = [];
        this.activeGenderFacets = [];
        this.myCurrentBiographySearchSorting = 0;
        this.setPageSize(30);
        this.processUpdatedFilter();
    }


    setPageSize(givenSize: number) {
        if (GlobalState.BiographyPageSize != givenSize) {
            this.myCurrentPageSize = givenSize;
            GlobalState.BiographyPageSize = givenSize;
            this.routeToPage(1); // go to first page of "new" page of results (hence the updating of myCurrentPageSize first right before routeToPage)
        }
    }

    setSearchPageSize(newSize: number) {
        GlobalState.BiographyPageSize = newSize;
        this.bioResultsPageSize = newSize;
    }

    setBioSearchSorting(newSortingPreference: number) {
        this.myCurrentBiographySearchSorting = newSortingPreference;
        if (GlobalState.BiographySearchSortingPreference >= 0 && GlobalState.BiographySearchSortingPreference < this.bioSearchSortFields.length) {
            // There was a prior valid sorting preference, so clear it.
            this.bioSearchSortFields[GlobalState.BiographySearchSortingPreference].selected = false;
        }
        GlobalState.BiographySearchSortingPreference = newSortingPreference;
        this.bioSearchSortFields[newSortingPreference].selected = true;
    }

    setBioSearchSortingAndDoTheSort(newSortingPreference: number) {
        this.setBioSearchSorting(newSortingPreference); // set the new sorting state
        this.routeToPage(1); // go to first page of "new" page of results (hence the updating of GlobalState.BiographySearchSortingPreference first right before routeToPage)
    }

    private processClearedFilter() {
        var filterSpecInPlay: string = "";
        if (this.activeGenderFacets.length > 0 || this.activeJobFacets.length > 0 || this.activeYearFacets.length > 0 || this.activeLastInitialFacets.length > 0) {
            this.biographySetTitle = "Fetching Filtered Page 1... (in progress)";
            this.titleManagerService.setTitle(GlobalState.PENDING_SCIENCEMAKERS_SET_TITLE);
            // Fold in filter spec, too:
            filterSpecInPlay = this.specStringFromActiveFacets();
        }
        else {
            // Special case: note that we have removed the last remaining filter, i.e., we have an empty filter specification.
            this.biographySetTitle = "Fetching Page 1... (in progress)";
            this.titleManagerService.setTitle(GlobalState.PENDING_SCIENCEMAKERS_SET_TITLE);
            // Note: for no filter spec in play, filterSpecInPlay remains as ""
        }
        this.setOptionsAndRouteToPage(this.myBornThisTimeFilterFlag, this.myCurrentQuery, 1, this.myCurrentPageSize,
            this.myCurrentSearchLastNameOnlyFlag, this.myCurrentSearchPreferredNameOnlyFlag, this.myCurrentBiographySearchSorting, filterSpecInPlay);
    }

    private processUpdatedFilter() {
        // Do the filtering by calling the router with an updated spec argument, returning to page 1 of the newly filtered set:
        this.biographySetTitle = "Fetching Filtered Page 1... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_SCIENCEMAKERS_SET_TITLE);
        // Accumulate routing parameters specifying filter specification, page information, etc.
        this.setOptionsAndRouteToPage(this.myBornThisTimeFilterFlag, this.myCurrentQuery, 1, this.myCurrentPageSize,
            this.myCurrentSearchLastNameOnlyFlag, this.myCurrentSearchPreferredNameOnlyFlag, this.myCurrentBiographySearchSorting, this.specStringFromActiveFacets());
    }

    doBiographySearch() {
        // Actions are similar to routeToPage() except that a new query is loaded via textQuery,
        // and "in progress" title can note that a new query is being fetched.
        this.selectedBiographyID = GlobalState.NO_ACCESSION_CHOSEN;

        this.biographySetTitle = "Searching... (in progress)";
        this.titleManagerService.setTitle(GlobalState.PENDING_SCIENCEMAKERS_SET_TITLE);

        GlobalState.BiographySearchLastNameOnly = this.searchLastNameOnly;
        GlobalState.BiographySearchPreferredNameOnly = this.searchPreferredNameOnly;

        // NOTE: any filters (i.e., active facets) are cleared away on a new search.  Also, there is NO override of this.myBornThisTimeFilterFlag;
        // instead, the first parameter is false to indicate that the query will go forward.
        // Load page 1, and use page size from global state
        // Use 'search just the last name', etc. indicator(s) from the interface, and not necessarily the one in use with loaded current query
        this.setOptionsAndRouteToPage(false, this.textQuery, 1, GlobalState.BiographyPageSize, this.searchLastNameOnly,
          this.searchPreferredNameOnly,  this.myCurrentBiographySearchSorting, "");
    }

    noNeedForBiographySearch(): boolean { // Returns true iff there is no need for search action (no search query).
        return (this.textQuery == null || this.textQuery.length == 0);
    }

    searchFieldChange(currentPick: string) {
        if (currentPick == "last name") {
            this.searchLastNameOnly = true;
            this.searchPreferredNameOnly = false;
        }
        else if (currentPick == "preferred name") {
            this.searchLastNameOnly = false;
            this.searchPreferredNameOnly = true;
        }
        else { // "chosen fields" picked, so do not limit search to just one field or the other
            this.searchLastNameOnly = false;
            this.searchPreferredNameOnly = false;
        }
        GlobalState.BiographySearchLastNameOnly = this.searchLastNameOnly;
        GlobalState.BiographySearchPreferredNameOnly = this.searchPreferredNameOnly;
        this.searchByField = currentPick;
    }

    setField() {
        if (this.searchLastNameOnly === true) {
            this.searchByField = "last name";
        }
        else if (this.searchPreferredNameOnly === true) {
            this.searchByField = "preferred name";
        }
        else { // "chosen fields" picked, so do not limit search to just one field or the other
            this.searchByField = "all fields";
        }
    }

    toggleMobileFilters() {
        this.mobileFiltersOpen ? this.mobileFiltersOpen = false : this.mobileFiltersOpen = true;
    }

}
