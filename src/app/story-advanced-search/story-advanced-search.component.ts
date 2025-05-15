import { Component, OnInit, AfterViewChecked, inject, viewChild } from '@angular/core';

import { ActivatedRoute, Params, RouterLink, RouterLinkActive } from '@angular/router';

import { GlobalState } from '../app.global-state';
import { TitleManagerService } from '../shared/title-manager.service';

import { SearchFormService } from '../shared/search-form/search-form.service';
import { SearchFormComponent } from '../shared/search-form/search-form.component';

import { SearchFormOptions } from '../shared/search-form/search-form-options';
import { BaseComponent } from '../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { FocusMeDirective } from '../shared/focus-me.directive';
 // used to read changes to set title

@Component({
    selector: 'thda-story-advs',
    templateUrl: './story-advanced-search.component.html',
    styleUrls: ['./story-advanced-search.component.scss'],
    imports: [FocusMeDirective, SearchFormComponent, RouterLink, RouterLinkActive]
})
export class StoryAdvancedSearchComponent extends BaseComponent implements OnInit, AfterViewChecked {
    private route = inject(ActivatedRoute);
    private globalState = inject(GlobalState);
    private searchFormService = inject(SearchFormService);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    readonly mySearchFormElement = viewChild<SearchFormComponent>('myStorySearchForm');

    public biographyIDForLimitingSearch: number = null; // used to modify UI in associated html (hence public)

    storyAdvSearchPageTitle: string;
    storyAdvSearchPageTitleLong: string;
    signalFocusToTitle: boolean = false; // is used in html rendering of this component

    constructor() {

        super(); // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)

        this.searchFormService.setSearchOptions(new SearchFormOptions(false, this.globalState.NOTHING_CHOSEN, this.globalState.NO_ACCESSION_CHOSEN, true)); // note: may perhaps be called again with a chosen bio ID
    }

    ngOnInit() {
        this.storyAdvSearchPageTitle = "Story Advanced Search";
        this.storyAdvSearchPageTitleLong = "Story Advanced Search, ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.storyAdvSearchPageTitleLong);
        this.liveAnnouncer.announce(this.storyAdvSearchPageTitle); // NOTE: using LiveAnnouncer to eliminate possible double-speak

        this.route.params.forEach((params: Params) => {
            if (params['ip'] !== undefined && !isNaN(+params['ip']) && params['ia'] !== undefined) {
                var candidateID: number = +params['ip'];
                var candidateAccession: string = params['ia'];
                if (candidateID != this.globalState.NOTHING_CHOSEN) {
                    this.biographyIDForLimitingSearch = candidateID;
                    // NOTE: when searching within a non-empty accession, the advanced search options (to filter by interview date) are turned off!
                    // So, last parameter is false here because we have candidateAccession != this.globalState.NO_ACCESSION_CHOSEN
                    this.searchFormService.setSearchOptions(new SearchFormOptions(false, candidateID, candidateAccession,
                        (candidateAccession == this.globalState.NO_ACCESSION_CHOSEN))); // note the "search within this person's stories" option
                }
            }
        });
    }

    ngAfterViewChecked() {
        // Attempt focus to the query input element once everything is set up.
        var focusSetElsewhere: boolean = false;

        const mySearchFormElement = this.mySearchFormElement();
        if (mySearchFormElement) {
            focusSetElsewhere = true;
            mySearchFormElement.setFocusToQueryInput();
        }

        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            if (!focusSetElsewhere)
                // default to focus on title if input focus not possible
                // since we did internally route in the SPA (single page application)
                this.signalFocusToTitle = true;
        }
    }
}
