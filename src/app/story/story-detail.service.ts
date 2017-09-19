import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { DetailedStory } from './detailed-story';
import { ServiceBase } from '../shared/config-paths';

@Injectable()
export class StoryDetailService {
    private storyDetailsURL = 'StoryDetails?storyID=';
    private storyDetailsQueryTermsArgument = '&queryTerms=';

    constructor(@Inject(ServiceBase) private serviceBase:string, private http: Http) { }

    getStorySpecifics(ID: number, queryTerms: string): Promise<DetailedStory> {
        // NOTE: If ID not found in the data set, then null is returned to caller
        var serviceURL: string = this.serviceBase + this.storyDetailsURL + ID;

        // TODO: (!!!TBD!!!): Perhaps add in another argument to optionally limit the length of the timing pairs array returned in this call.
        // (Currently the service decides whether to truncate timing pairs.)

        if (queryTerms != null && queryTerms.length > 0)
            serviceURL += this.storyDetailsQueryTermsArgument + queryTerms;

        return this.http.get(serviceURL)
            .toPromise()
            .then(response => {
                return response.json();
            })
            .catch(this.handleError);
    }

    private handleError(error: any) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
