import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { DetailedBiographyStorySet } from './detailed-biography-storyset';

import { ServiceBase } from '../shared/config-paths';

@Injectable()
export class BiographyStorySetService {
    private biographyStorySetDetailURL = 'biographyDetails?accession='; // must get an "accession" unique identifier tacked on to work of course

    constructor(@Inject(ServiceBase) private serviceBase:string, private http: Http) {}

    getStoriesInBiography(accession: string): Promise<DetailedBiographyStorySet> {
        return this.http.get(this.serviceBase + this.biographyStorySetDetailURL + accession)
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
