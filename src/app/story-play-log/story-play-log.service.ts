import { Injectable, OnInit, inject } from '@angular/core';
import { takeUntil } from "rxjs/operators";

import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { StoryPlayLogInfo } from './story-play-log-info';
import { environment } from '../../environments/environment';
import { BaseComponent } from '../shared/base.component';

@Injectable()
export class StoryPlayLogService extends BaseComponent {
    private http = inject(HttpClient);

    private postStoryPlayEventURL = 'StoryPlayEvent';

    postStoryPlayEvent(storyID: string, accession: string, sessionOrder: number, tapeOrder: number, storyOrder: number, title: string) {
        var storyPlayLogInfo: StoryPlayLogInfo = new StoryPlayLogInfo(storyID, accession, sessionOrder, tapeOrder, storyOrder, title);

        const headers = new HttpHeaders({'Content-Type':'application/json; charset=utf-8'});
        this.http.post(environment.serviceBase + this.postStoryPlayEventURL, storyPlayLogInfo, {headers: headers}).pipe(takeUntil(this.ngUnsubscribe)).subscribe(
          (data) => {
            // TODO: not sure if we want to log this to analytics or console, e.g., console.log(data);
          },
          (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
              console.log('Client-side error occurred with posting story play event.');
            } else {
              console.log('Server-side error occurred with posting story play event.');
            }
          }
        );
    }
}
