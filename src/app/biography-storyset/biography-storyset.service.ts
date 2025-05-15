import { Injectable, OnInit, inject } from '@angular/core';
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { HttpClient } from '@angular/common/http';

import { DetailedBiographyStorySet } from './detailed-biography-storyset';
import { environment } from '../../environments/environment';

@Injectable()
export class BiographyStorySetService {
    private http = inject(HttpClient);

    private biographyStorySetDetailURL = 'BiographyDetails?accession=';

    getStoriesInBiography(accession: string): Observable<DetailedBiographyStorySet> {
        return this.http.get<DetailedBiographyStorySet>(environment.serviceBase + this.biographyStorySetDetailURL + accession).pipe(
          catchError( err => {
            // TODO: (!!!TBD!!!) Decide if we wish to log errors in any way or use console, e.g., console.log('error caught: ', err);
            return throwError(() => err); }
          )
        );
    }
}
