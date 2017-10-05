import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

import { DetailedBiographyStorySet } from './detailed-biography-storyset';

import { AppConfig } from '../config/app-config';

@Injectable()
export class BiographyStorySetService {
    private biographyStorySetDetailURL = 'biographyDetails?accession='; // must get an "accession" unique identifier tacked on to work of course

    constructor(private http: Http, private config: AppConfig) {}

    getStoriesInBiography(accession: string): Promise<DetailedBiographyStorySet> {
        let serviceBase:string = this.config.getConfig('serviceBase');
        return this.http.get(serviceBase + this.biographyStorySetDetailURL + accession)
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
