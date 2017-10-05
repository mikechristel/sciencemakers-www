import { Injectable, Inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { FeedbackInfo } from './feedback-info';
import { AppConfig } from '../config/app-config';

@Injectable()
export class FeedbackService {
    private postFeedbackURL = 'feedback';


    constructor(private http: Http, private config: AppConfig) {}

    postFeedback(feedbackMessage: string): Promise<any> {
        var UNKNOWN_MARKER: string = "*Unknown*";
        var feedbackInfo: FeedbackInfo = new FeedbackInfo();
        var language: string = UNKNOWN_MARKER;
        var userAgent: string = UNKNOWN_MARKER;
        var platform: string = UNKNOWN_MARKER;
        var myURL: string = UNKNOWN_MARKER;

        var resolutionInfo: string = UNKNOWN_MARKER;
        if (window != null && window.navigator != null) {
            if (window.navigator.language != null)
                language = window.navigator.language;
            if (window.navigator.userAgent != null)
                userAgent = window.navigator.userAgent;
            if (window.navigator.platform != null)
                platform = window.navigator.platform;
            if (window.innerWidth != null && window.innerHeight != null)
                resolutionInfo = window.innerWidth + "x" + window.innerHeight;
        }
        if (document != null && document.location != null && document.location.href != null)
            myURL = document.location.href;
        feedbackInfo.Comments = feedbackMessage;
        feedbackInfo.Date = new Date().toUTCString();
        feedbackInfo.Language = language;
        feedbackInfo.Platform = platform;
        feedbackInfo.Resolution = resolutionInfo;
        feedbackInfo.URL = myURL;
        feedbackInfo.UserAgent = userAgent;

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });
        let serviceBase:string = this.config.getConfig('serviceBase');
        return this.http.post(serviceBase + this.postFeedbackURL, feedbackInfo, options)
            .toPromise()
            .then(this.extractData)
            .catch(this.handleError);
    }

    private extractData(res: Response) {
        let body = res;
        // Not planning to do anything of consequence with body, which likely states "Response with status: 200 OK for URL: ..."
        return body || {};
    }

    private handleError(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error('An error occurred', errMsg);
        return Promise.reject(errMsg);
    }
}
