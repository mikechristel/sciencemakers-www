import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { SearchResult } from '../storyset/search-result';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { ServiceBase } from '../shared/config-paths';

@Injectable()
export class IDSearchService {
    private idSearchURL = 'FavoritesSet?csvStoryIDs='; // require csv argument, so it is already tacked on

    constructor(@Inject(ServiceBase) private serviceBase:string, private http: Http, private historyMakerService: HistoryMakerService) { }

    getIDSearch(csvIDList: string, givenPage: number, givenPageSize: number, genderFacet: string, yearFacets: string, makerFacets: string, jobFacets: string): Promise<SearchResult> {
        var addedArgs: string = "";
        if (givenPage != null && givenPage > 0)
            addedArgs = addedArgs + "&currentPage=" + givenPage;
        if (givenPageSize != null && givenPageSize > 0)
            addedArgs = addedArgs + "&pageSize=" + givenPageSize;
        if (genderFacet != null && genderFacet.length > 0)
            addedArgs = addedArgs + "&genderFacet=" + genderFacet;
        if (yearFacets != null && yearFacets.length > 0)
            addedArgs = addedArgs + "&yearFacet=" + yearFacets;
        if (makerFacets != null && makerFacets.length > 0)
            addedArgs = addedArgs + "&makerFacet=" + makerFacets;
        if (jobFacets != null && jobFacets.length > 0)
            addedArgs = addedArgs + "&jobFacet=" + jobFacets;

        // NOTE: cannot proceed to an ID search before first having search facets all in place.
        return this.historyMakerService.getFacetDetails()
            .then(response => {
                return this.http.get(this.serviceBase + this.idSearchURL + csvIDList + addedArgs)
                    .toPromise()
                    .then(response => {
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
