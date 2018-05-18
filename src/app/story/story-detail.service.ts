import { Injectable, Inject, OnInit } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { HttpClient } from '@angular/common/http';

import { DetailedStory } from './detailed-story';
import { environment } from '../../environments/environment';

@Injectable()
export class StoryDetailService {
    private storyDetailsURL = 'StoryDetails?storyID=';
    private storyDetailsQueryTermsArgument = '&queryTerms=';

    constructor(private http: HttpClient) { }

    getStorySpecifics(ID: number, queryTerms: string): Observable<DetailedStory> {
        // NOTE: If ID not found in the data set, then null is returned to caller
        var serviceURL: string = environment.serviceBase + this.storyDetailsURL + ID;

        // TODO: (!!!TBD!!!): Perhaps add in another argument to optionally limit the length of the timing pairs array returned in this call.
        // (Currently the service decides whether to truncate timing pairs.)

        if (queryTerms != null && queryTerms.length > 0)
            serviceURL += this.storyDetailsQueryTermsArgument + queryTerms;

        return this.http.get<DetailedStory>(serviceURL);
    }
}
