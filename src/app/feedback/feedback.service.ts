import { Injectable, Inject, OnInit } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { takeUntil } from "rxjs/operators";

import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { FeedbackInfo } from './feedback-info';
import { environment } from '../../environments/environment';
import { BaseComponent } from '../shared/base.component';

declare var _aname: any; // Declaration of js variable holding account name (or "" if not set)

@Injectable()
export class FeedbackService extends BaseComponent {
    public presentFeedbackInputForm: Subject<boolean> = new Subject<boolean>();
    public presentFeedbackInputForm$ = this.presentFeedbackInputForm.asObservable();

    private postFeedbackURL = 'Feedback';


    constructor(private http: HttpClient) {
        super(); // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)
    }

    triggerFeedbackInputForm() {
        // NOTE: Relying on a listener to changes in presentFeedbackInputForm to actually do the (modal) feedback input form display.
        // Here we just signal it.
        this.presentFeedbackInputForm.next(true);
    }

    postFeedback(feedbackMessage: string) {
        var UNKNOWN_MARKER: string = "*Unknown*";
        var feedbackInfo: FeedbackInfo = new FeedbackInfo();
        var language: string = UNKNOWN_MARKER;
        var userAgent: string = UNKNOWN_MARKER;
        var myURL: string = UNKNOWN_MARKER;
        var accountName: string = UNKNOWN_MARKER;

        var resolutionInfo: string = UNKNOWN_MARKER;
        if (window != null && window.navigator != null) {
            if (window.navigator.language != null)
                language = window.navigator.language;
            if (window.navigator.userAgent != null)
                userAgent = window.navigator.userAgent;
            if (window.innerWidth != null && window.innerHeight != null)
                resolutionInfo = window.innerWidth + "x" + window.innerHeight;
        }
        if (window != null && window.location != null && window.location.href != null) {
          var currentURL = window.location.href;
          if (currentURL.length > 0)
            myURL = currentURL; // trust if not empty and not null
        }
        if (_aname != null && _aname != "")
            accountName = _aname;

        feedbackInfo.Comments = feedbackMessage;
        feedbackInfo.Date = new Date().toISOString();
        feedbackInfo.Language = language;
        feedbackInfo.Resolution = resolutionInfo;
        feedbackInfo.URL = myURL;
        feedbackInfo.UserAgent = userAgent;
        feedbackInfo.AccountName = accountName;

        const headers = new HttpHeaders({'Content-Type':'application/json; charset=utf-8'});
        this.http.post(environment.serviceBase + this.postFeedbackURL, feedbackInfo, {headers: headers}).pipe(takeUntil(this.ngUnsubscribe)).subscribe(
          (data) => {
            // TODO: not sure if we want to log this to analytics or console, e.g., console.log(data);
          },
          (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
              console.log('Client-side error occurred with posting feedback.');
            } else {
              console.log('Server-side error occurred with posting feedback.');
            }
          }
        );
    }
}
