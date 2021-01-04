import { Component, OnInit } from '@angular/core';
import { takeUntil } from "rxjs/operators";

import { HistoryMakerService } from '../historymakers/historymaker.service';
import { TitleManagerService } from '../shared/title-manager.service';
import { SearchFormService } from '../shared/search-form/search-form.service';
import { StorySetType } from '../storyset/storyset-type';

import { GlobalState } from '../app.global-state';
import { environment } from '../../environments/environment';

import { BriefBio } from '../historymakers/brief-bio';

import { SearchFormOptions } from '../shared/search-form/search-form-options';
import { BaseComponent } from '../shared/base.component';
import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title

@Component({
    selector: 'thda-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent extends BaseComponent implements OnInit {
    txtQuery: string = ""; // this is the query string as edited by the user

    scienceMakersStoryCount: string;
    fullStoryCount: string;
    scienceMakersBiographyCount: string;
    fullBiographyCount: string;
    lastUpdateDatePhrase: string = "";
    today: number = Date.now();

    biographies: BriefBio[];
    signalFocusToBiographyID: string; // is used in html rendering of this component

    confirmedNoBirthdays: boolean;

    signalFocusToTitle: boolean;
    public myMediaBase: string;

    constructor(
        private globalState: GlobalState,
        private historyMakerService: HistoryMakerService,
        private userSettingsManagerService: UserSettingsManagerService,
        private titleManagerService: TitleManagerService,
        private searchFormService: SearchFormService, private liveAnnouncer: LiveAnnouncer) {

        super(); // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)

        // Start off with an empty signal about what to focus on
        this.clearSignalsForCurrentFocusSetting();

        this.myMediaBase = environment.mediaBase;

        this.searchFormService.setSearchOptions(new SearchFormOptions(false, this.globalState.NOTHING_CHOSEN, this.globalState.NO_ACCESSION_CHOSEN, false));
    }

    ngOnInit() {
        this.titleManagerService.setTitle("ScienceMakers Digital Archive (January 4, 2021)");
        this.liveAnnouncer.announce("ScienceMakers Digital Archive"); // NOTE: using LiveAnnouncer to eliminate possible double-speak

        this.historyMakerService.getCorpusSpecifics().pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(corpusDetails => {
                this.fullStoryCount = corpusDetails.stories.all.toLocaleString();
              // NOTE: when testing, we may not have specific ScienceMakers counts, as that is a "special" API that might not be in the testing infrastructure.
              // So, do not presume the existence of these counts.
              if (corpusDetails.biographies.scienceMakerCount)
                  this.scienceMakersBiographyCount = corpusDetails.biographies.scienceMakerCount.toLocaleString();
              if (corpusDetails.stories.scienceMakerCount)
                  this.scienceMakersStoryCount = corpusDetails.stories.scienceMakerCount.toLocaleString();
              var lastUpdateDateString:string = corpusDetails.lastUpdated;
              if (lastUpdateDateString && lastUpdateDateString.length > 0) {
                  var lastUpdateDate: Date = new Date(lastUpdateDateString);
                  this.lastUpdateDatePhrase = "as of " +
                    this.globalState.cleanedMonthDayYearFromNumbers(lastUpdateDate.getMonth(), lastUpdateDate.getDate(),
                      lastUpdateDate.getFullYear());
              }
              this.fullBiographyCount = corpusDetails.biographies.all.toLocaleString();
            });

        // Do not qualify the people born this week in any way (i.e., no filtering, no paging): just get them all (hence null filtering/paging parameters):
        this.historyMakerService.getHistoryMakersBornThisWeek(null, null, null, null, null, null, null, null).pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(retSet => {
                this.biographies = retSet.biographies;
                if (this.biographies == null || this.biographies.length == 0) {
                    this.confirmedNoBirthdays = true;
                }
                this.setFocusAsNeeded(); // with contents fully loaded - set the focus
            });
    }

    private setFocusAsNeeded() {
        var focusSetElsewhere: boolean = false;

        // Check on scroll and focus to selected biography item once everything is set up, but only do focus/scroll action
        // if focus is not set to something else above.
        var selectedBioIDItem = this.userSettingsManagerService.currentBioIDToFocus();
        if (selectedBioIDItem && selectedBioIDItem.length > 0) {
            if (!focusSetElsewhere) {
                this.signalFocusToBiographyID = selectedBioIDItem; // can focus to biography item because nothing else was picked earlier
                focusSetElsewhere = true;
            }
            // Once used, or once something else was focused on via "focusSetElsewhere", clear the bio id to focus.
            this.userSettingsManagerService.updateBioIDToFocus("");
        }

        this.userSettingsManagerService.updateStoryIDToFocus(this.globalState.NOTHING_CHOSEN); // forget any story ID to focus

        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            if (!focusSetElsewhere)
                // Set default focus to the title for this route, since we did internally route
                // in the SPA (single page application)
                // (as it is the target for skip-to-main content as well)
                this.signalFocusToTitle = true;
        }

        // If we used pending focus flags, here is where they would be reset, after signals are all in place: this.clearPendingFocusInstructions();

    }

    private clearSignalsForCurrentFocusSetting() {
        this.signalFocusToBiographyID = "";
        this.signalFocusToTitle = false;
    }

}
