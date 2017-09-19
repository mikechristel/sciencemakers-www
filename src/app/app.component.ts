import { Component }       from '@angular/core';
import { Router, NavigationEnd } from '@angular/router'; // Router added to provide analytics on route changes

// Add the RxJS Observable operators we need in this app.
import './rxjs-operators';

import { FeedbackService } from './feedback/feedback.service';
import { PlaylistManagerService } from './playlist-manager/playlist-manager.service';
import { Playlist } from './shared/playlist/playlist';
import { Subscription }   from 'rxjs/Subscription';

declare let ga: Function; // Declaration used with Google Analytics

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent {
    public givenFeedback: string = null;
    public menuOpen: boolean = false;
    public mobileSearchOpen: boolean = false;
    private subscription: Subscription;
    public playlist: Playlist[];

    constructor(public router: Router,
        private feedbackService: FeedbackService,
        private playlistManagerService: PlaylistManagerService) {
        this.subscription = playlistManagerService.playlist$.subscribe((value) => {
            this.playlist = value;
        })
        // The event tracking tying in navigation ending of routing with Google Analytics is following
        // advice from blog.thecodecampus.de/angular-2-google-analytics-google-tag-manager/
        this.router.events.subscribe(event => {
          if (event instanceof NavigationEnd) {
            // NOTE:  It would be nice to just use event.urlAfterRedirects, *but* unfortunately, the semicolon(s) used
            // to separate query parameters in the route, i.e., matrix URL notation, mess up Google Analytics, which stops
            // reporting the URL from the first encountered semicolon onward.  So, process the URL and replace the first
            // ";" with "?" and all subsequent ";" with "&" and pass that on to Google Analytics instead.
            // See https://github.com/DSpace/dspace-angular/issues/109 for details (which were still in effect June 2017).
            ga('set', 'page', this.cleanedForAnalyticsReport(event.urlAfterRedirects));
            ga('send', 'pageview');
          }
        });

    }

    ngOnInit() {
        this.playlist = this.playlistManagerService.initializePlaylist();
    }

    private cleanedForAnalyticsReport(givenURI: string): string {
        var retVal: string = givenURI;
        const symbolToCleanAway: string = ";";
        var workVal: number = retVal.indexOf(symbolToCleanAway);

        // Turn string like /stories/2;q=mischief;pg=1;pgS=30;a=0 into /stories/2?q=mischief&pg=1&pgS=30&a=0 and
        // /stories/2;q=snow%20%26%20ice;a=0;sT=0;sS=0;sID=55079;spec=--;pgS=30;pg=1 into
        // /stories/2?q=snow%20%26%20ice&a=0&sT=0&sS=0&sID=55079&spec=--&pgS=30&pg=1
        if (workVal >= 0) {
            if (workVal == 0)
                retVal = "?" + retVal.substring(1);
            else if (workVal < retVal.length - 1)
                retVal = retVal.substring(0, workVal) + "?" + retVal.substring(workVal + 1);
            else
                retVal = retVal.substring(0, workVal) + "?";
            workVal = retVal.indexOf(symbolToCleanAway);
            while (workVal >= 0) {
                if (workVal < retVal.length - 1)
                    retVal = retVal.substring(0, workVal) + "&" + retVal.substring(workVal + 1);
                else
                    retVal = retVal.substring(0, workVal) + "&";
                workVal = retVal.indexOf(symbolToCleanAway);
            }
        }
        return retVal;
    }

    toggleMenu(menuState?: string) {
        switch(menuState) {
            case 'open':
                this.menuOpen = true;
                this.mobileSearchOpen = false;
                break;
            case 'close':
                this.menuOpen = false;
                break;
            default:
                this.menuOpen ? this.menuOpen = false : this.menuOpen = true;
                this.mobileSearchOpen = false;
        }
    }

    toggleMobileSearch(menuState?: string) {
        switch(menuState) {
            case 'open':
                this.mobileSearchOpen = true;
                this.menuOpen = false;
                break;
            case 'close':
                this.mobileSearchOpen = false;
                break;
            default:
                this.mobileSearchOpen ? this.mobileSearchOpen = false : this.mobileSearchOpen = true;
                this.menuOpen= false;
        }
    }

    cancelFeedback() {
        this.givenFeedback = null;
    }

    postFeedback() {
        var feedbackMessage: string;

        if (this.givenFeedback) {
            feedbackMessage = this.givenFeedback.trim();
            if (feedbackMessage.length > 0) {
                this.feedbackService.postFeedback(feedbackMessage).then(res => {
                    // not bothering with any update on whether feedback accepted or not...
                });
            }
        }
    }

    shiftFocus(focusTarget: string) {
        // Used to shift focus to the main container for a11y support. This is a temporary workaround
        // until Angular router fully supports id hash links: https://github.com/angular/angular/issues/6595
        document.getElementById(focusTarget).focus();
    }

}
