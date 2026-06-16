import { Component, OnInit, AfterViewChecked, inject, viewChild } from '@angular/core';

import { TitleManagerService } from '../shared/title-manager.service';

import { GlobalState } from '../app.global-state';

import { SearchFormComponent } from '../shared/search-form/search-form.component';
import { SearchFormService } from '../shared/search-form/search-form.service';
import { SearchFormOptions } from '../shared/search-form/search-form-options';
import { ThinBaseComponent }  from '../shared/thinbase.component';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { FocusMeDirective } from '../shared/focus-me.directive';
import { RouterLink, RouterLinkActive } from '@angular/router'; // used to read changes to set title

@Component({
    selector: 'thda-bio-advs',
    templateUrl: './bio-advanced-search.component.html',
    styleUrls: ['./bio-advanced-search.component.scss'],
    imports: [FocusMeDirective, SearchFormComponent, RouterLink, RouterLinkActive]
})
export class BiographyAdvancedSearchComponent extends ThinBaseComponent implements OnInit, AfterViewChecked {
    private titleManagerService = inject(TitleManagerService);
    private searchFormService = inject(SearchFormService);
    private globalState = inject(GlobalState);
    private liveAnnouncer = inject(LiveAnnouncer);

    readonly mySearchFormElement = viewChild<SearchFormComponent>('myBioSearchForm');
    bioAdvSearchPageTitle: string = "";
    bioAdvSearchPageTitleLong: string = "";
    signalFocusToTitle: boolean = false; // is used in html rendering of this component

    constructor() {
        super(); // for ThinBaseComponent extension (brought in for mouse event handler noMouseFocus)
        this.searchFormService.setSearchOptions(new SearchFormOptions(true, this.globalState.NOTHING_CHOSEN, this.globalState.NO_ACCESSION_CHOSEN, false));
    }

    ngOnInit() {
        this.bioAdvSearchPageTitle = "Biography Advanced Search";
        this.bioAdvSearchPageTitleLong = "Biography Advanced Search, ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.bioAdvSearchPageTitleLong);
        this.liveAnnouncer.announce(this.bioAdvSearchPageTitle); // NOTE: using LiveAnnouncer to eliminate possible double-speak
    }

    ngAfterViewChecked() {
        var focusSetElsewhere: boolean = false;
        // Attempt focus to the query input element once everything is set up.
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
