import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { SearchResult } from '../storyset/search-result';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { ServiceBase } from '../shared/config-paths';
import { GlobalState } from '../app.global-state';

import { GoogleAnalyticsEventsService } from '../google-analytics-events.service';

@Injectable()
export class TextSearchService {
    private txtSearchURL = 'StorySearch?query='; // require query argument, so it is already tacked on

    constructor(@Inject(ServiceBase) private serviceBase:string,
      private http: Http,
      private historyMakerService: HistoryMakerService,
      private gaService: GoogleAnalyticsEventsService) { }

    getTextSearch(query: string, interviewYearFilter: string, parentBiographyForAllStories: number, matchTitleOnly: boolean, matchTranscriptOnly: boolean,
        givenPage: number, givenPageSize: number, genderFacet: string, birthyearFacets: string, makerFacets: string, jobFacets: string, sortField: string, sortInDescendingOrder: boolean): Promise<SearchResult> {
        var addedArgs: string = "";
        if (parentBiographyForAllStories != GlobalState.NOTHING_CHOSEN)
            addedArgs = addedArgs + "&parentBiographyID=" + parentBiographyForAllStories;
        if (givenPage != null && givenPage > 0)
            addedArgs = addedArgs + "&currentPage=" + givenPage;
        if (givenPageSize != null && givenPageSize > 0)
            addedArgs = addedArgs + "&pageSize=" + givenPageSize;
        if (matchTitleOnly)
            addedArgs = addedArgs + "&searchFields=title";
        else if (matchTranscriptOnly)
            addedArgs = addedArgs + "&searchFields=transcript";
        if (genderFacet != null && genderFacet.length > 0)
            addedArgs = addedArgs + "&genderFacet=" + genderFacet;
        if (birthyearFacets != null && birthyearFacets.length > 0)
            addedArgs = addedArgs + "&yearFacet=" + birthyearFacets;
        if (makerFacets != null && makerFacets.length > 0)
            addedArgs = addedArgs + "&makerFacet=" + makerFacets;
        if (jobFacets != null && jobFacets.length > 0)
            addedArgs = addedArgs + "&jobFacet=" + jobFacets;
        if (sortField != null && sortField.length > 0) {
            addedArgs = addedArgs + "&sortField=" + sortField;
            // Only bother with sortInDescendingOrder if sortField non-empty.
            if (sortInDescendingOrder != null)
              addedArgs = addedArgs + "&sortInDescendingOrder=" + sortInDescendingOrder;
        }
        // Decide whether interviewYearFilter is valid and non-empty: if so, tack on additional filter arguments
        // interviewYearFilterLowerBound and interviewYearFilterUpperBound
        if (interviewYearFilter != null && interviewYearFilter.length == 9 && interviewYearFilter[4] == "-") {
             // Have xxxx-xxxx as expected.  If each xxxx parses to a number, add in the filter arguments.
            var earlyYear: number = 0;
            var lateYear: number = 0;
            var workString: string = interviewYearFilter.substring(0, 4);
            if (!isNaN(+workString)) {
                earlyYear = +workString;
                workString = interviewYearFilter.substring(5, 9);
                if (!isNaN(+workString)) {
                    lateYear = +workString;
                    addedArgs = addedArgs + "&interviewYearFilterLowerBound=" + earlyYear + "&interviewYearFilterUpperBound=" + lateYear;
                }
            }
        }

        // NOTE: cannot proceed to a text search before first having search facets all in place.
        return this.historyMakerService.getFacetDetails()
            .then(response => {
                return this.http.get(this.serviceBase + this.txtSearchURL + query + addedArgs)
                    .toPromise()
                    .then(response => {
                        var quickAnswerCheck: SearchResult = response.json();
                        if (quickAnswerCheck.count > 0)
                            this.gaService.emitEvent("Text Query", "query=" + query + "&count=" + quickAnswerCheck.count + addedArgs);
                        else
                            this.gaService.emitEvent("Text Query (Empty)", "query=" + query + addedArgs);
                        return response.json();
                    })
                    .catch(this.handleError);
            })
            .catch(this.handleError);
    }

    private handleError(error: any) {
        if (error && error.status == 400 && error.statusText != null && error.statusText.length > 0)
            // don't bother with console display; hand on down to caller who will deal with reporting statusText
            return Promise.reject(error.statusText);

        // For other cases, do our default action.
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
