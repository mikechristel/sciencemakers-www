import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router, Params, RouterLink, RouterLinkActive } from '@angular/router';

import { TitleManagerService } from '../../shared/title-manager.service';
import { BaseComponent }  from '../../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../../app.global-state';
import { FocusMeDirective } from '../../shared/focus-me.directive';


@Component({
    selector: 'thda-help-search',
    templateUrl: './help-search.component.html',
    styleUrls: ['../help.component.scss'],
    imports: [FocusMeDirective, RouterLink, RouterLinkActive]
})
export class HelpSearchComponent extends BaseComponent implements OnInit {
    private globalState = inject(GlobalState);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    signalFocusToTitle: boolean = false; // is used in html rendering of this component

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
    }
}
