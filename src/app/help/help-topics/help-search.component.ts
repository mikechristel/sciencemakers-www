import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntil } from "rxjs/operators";

import { TitleManagerService } from '../../shared/title-manager.service';
import { BaseComponent }  from '../../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../../app.global-state';
// (RETIRED tagMatchDetails commented out so this not needed) import { HistoryMakerService } from '../../historymakers/historymaker.service'; // needed to (re)fetch corpus details as needed
import { UserSettingsManagerService } from '../../user-settings/user-settings-manager.service';

@Component({
    selector: 'thda-help-search',
    templateUrl: './help-search.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpSearchComponent extends BaseComponent implements OnInit {
    signalFocusToTitle: boolean = false; // is used in html rendering of this component
    // NOTE: turning off (but left in comments) the extra discussion on tagged biographies now that all
    // biographies will be attempted to be tagged:  tagMatchDetails: string = "";
    hideTopicSearch: boolean = false;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private userSettingsManagerService: UserSettingsManagerService,
        private globalState: GlobalState,
        private titleManagerService: TitleManagerService, private liveAnnouncer: LiveAnnouncer) {
			
		// as an argument.... private historyMakerService: HistoryMakerService, (commented out as it was only needed for tagMatchDetails)
          super(); // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)
    }

    ngOnInit() {
        var leadingPiece: string = "Help Page, Search";
        this.titleManagerService.setTitle(leadingPiece + ", ScienceMakers Digital Archive");
        this.liveAnnouncer.announce(leadingPiece); // NOTE: using LiveAnnouncer to eliminate possible double-speak

        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            // Set default focus to the title for this route, since we did internally route
            // in the SPA (single page application)
            // (as it is the target for skip-to-main content as well)
            this.signalFocusToTitle = true;
        }

        this.hideTopicSearch = this.userSettingsManagerService.currentHideTopicSearch();

        // (RETIRED tagMatchDetails commented out)...
        //if (!this.hideTopicSearch) {
            // Settings related to cached counts (used in giving help about Topic Search)

            // this.historyMakerService.getCorpusSpecifics().pipe(takeUntil(this.ngUnsubscribe))
            // .subscribe(corpusDetails => {
            //     this.updateTagMatchDetails(corpusDetails.biographies.tagged, corpusDetails.biographies.all);
            // });
        //}
    }

    /*  (RETIRED tagMatchDetails commented out)...    private updateTagMatchDetails(taggedBiographyCount: number, biographyCount: number) {
        if (biographyCount > 0) {
            // Two forms of excuse dependent on how much of corpus has been tagged.
            var limitForSmallSubsetExcuse: number = biographyCount / 4;
            if (taggedBiographyCount == 0)
                this.tagMatchDetails = "none of the " + biographyCount +
                  " HistoryMakers have tagged stories.  So, no stories will be returned at the ";
            else if (taggedBiographyCount < limitForSmallSubsetExcuse)
                this.tagMatchDetails = "a small subset, just " + taggedBiographyCount + " of " + biographyCount +
                  " HistoryMakers, have tagged stories.  You can explore this small subset within the ";
            else if (taggedBiographyCount < biographyCount)
                this.tagMatchDetails = "a subset, " + taggedBiographyCount + " of " + biographyCount +
                  " HistoryMakers, have tagged stories.  You can explore this subset within the ";
            else
                this.tagMatchDetails = "all of the " + biographyCount +
                " HistoryMakers have tagged stories.  So, the full corpus can be explored at the ";
        }
        else
            this.tagMatchDetails = ""; // essentially give up when there is no corpus
    }*/
}
