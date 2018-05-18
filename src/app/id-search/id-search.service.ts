import { Injectable, Inject, OnInit } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { HttpClient } from '@angular/common/http';

import { SearchResult } from '../storyset/search-result';
import { HistoryMakerService } from '../historymakers/historymaker.service';
import { environment } from '../../environments/environment';

@Injectable()
export class IDSearchService {
    private idSearchURL = 'FavoritesSet?csvStoryIDs='; // require csv argument, so it is already tacked on

    constructor(private http: HttpClient, private historyMakerService: HistoryMakerService) { }

    getIDSearch(csvIDList: string, givenPage: number, givenPageSize: number, genderFacet: string, yearFacets: string, makerFacets: string, jobFacets: string): Observable<SearchResult> {
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
          .flatMap(fd => this.http.get<SearchResult>(environment.serviceBase + this.idSearchURL + csvIDList + addedArgs));
    }
}
