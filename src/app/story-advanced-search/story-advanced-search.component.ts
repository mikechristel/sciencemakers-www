import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../title-manager.service';

import { GlobalState } from '../app.global-state';

import { StorySetType } from '../storyset/storyset-type';

import { environment } from '../../environments/environment';

@Component({
    selector: 'thda-story-advs',
    templateUrl: './story-advanced-search.component.html',
    styleUrls: ['./story-advanced-search.component.scss']
})
export class StoryAdvancedSearchComponent implements OnInit {
    storyAdvSearchPageTitle: string;
    storyAdvSearchPageTitleLong: string;

    txtQuery: string = ""; // this is the query string as edited by the user
    searchTitleOnly: boolean;
    searchTranscriptOnly: boolean;
    resultsSize: number;
    earliestInterviewYear: number;
    latestInterviewYear: number;

    filterByInterviewDate: boolean;

    fields: string[] = ['all fields','title','transcript'];
    searchByField: string;
    biographyIDForLimitingSearch: number;
    inputPlaceholder: string;

    interviewYears: number[];
    minYearAllowed: number;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
          this.minYearAllowed = environment.firstInterviewYear;
    }

    ngOnInit() {
        this.storyAdvSearchPageTitle = "Story Advanced Search Page";
        this.storyAdvSearchPageTitleLong = "Story Advanced Search Page, The ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.storyAdvSearchPageTitleLong);
        this.searchTitleOnly = GlobalState.SearchTitleOnly;
        this.searchTranscriptOnly = GlobalState.SearchTranscriptOnly;
        this.resultsSize = GlobalState.SearchPageSize;

        var currentYear = new Date().getFullYear();
        this.interviewYears = [];
        for (var i = this.minYearAllowed; i <= currentYear; i++)
            this.interviewYears.push(i);
        if (GlobalState.EarliestInterviewYearToKeep == 0)
            this.earliestInterviewYear = this.minYearAllowed;
        else
            this.earliestInterviewYear = GlobalState.EarliestInterviewYearToKeep;
        if (GlobalState.LatestInterviewYearToKeep == 0)
            this.latestInterviewYear = currentYear;
        else
            this.latestInterviewYear = GlobalState.LatestInterviewYearToKeep;
        this.filterByInterviewDate = false;

        this.setField();

        this.route.params.forEach((params: Params) => {
            if (params['ip'] !== undefined && !isNaN(+params['ip'])) {
                this.biographyIDForLimitingSearch = +params['ip'];
                if (this.biographyIDForLimitingSearch != GlobalState.NOTHING_CHOSEN)
                    this.inputPlaceholder = "Search this person's stories...";
                else {
                    this.biographyIDForLimitingSearch = null;
                }
            }
        });
        if (this.biographyIDForLimitingSearch == null)
            this.inputPlaceholder = "Search stories...";
    }

    doSearch() {
        // This legal range check should be built into the input controls, but just in case, do possibly redundant check here:
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

            if (this.filterByInterviewDate  && this.interviewYears != null && this.interviewYears.length > 0) {
                // Quick check that a filter is in existence, i.e., the choice is not [min, max] which is the same as no filter at all
                if (this.earliestInterviewYear > this.interviewYears[0] || this.latestInterviewYear < this.interviewYears[this.interviewYears.length - 1]) {
                    // A filter not equal to [min, max] is given.  Pass it in the route.
                    // One last fix: if user put in max, min rather than min, max, do the fix here and in GlobalState tracking variables.
                    if (this.earliestInterviewYear > this.latestInterviewYear) {
                        GlobalState.EarliestInterviewYearToKeep = this.latestInterviewYear;
                        this.latestInterviewYear = this.earliestInterviewYear;
                        this.earliestInterviewYear = GlobalState.EarliestInterviewYearToKeep;
                        GlobalState.LatestInterviewYearToKeep = this.latestInterviewYear;
                    }
                    moreOptions['iy'] = this.earliestInterviewYear + "-" + this.latestInterviewYear;
                }
            }
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

    setInterviewYearBound(newBound: number, setTheLowerBound: boolean) {
        if (setTheLowerBound) {
            this.earliestInterviewYear = newBound;
            GlobalState.EarliestInterviewYearToKeep = newBound;
        }
        else {
            this.latestInterviewYear = newBound;
            GlobalState.LatestInterviewYearToKeep = newBound;
        }
     }

     toggleFilterByInterviewDate() {
        this.filterByInterviewDate = !this.filterByInterviewDate;
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
}
