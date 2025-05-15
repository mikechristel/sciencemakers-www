import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router, Params, RouterLink, RouterLinkActive } from '@angular/router';

import { TitleManagerService } from '../../shared/title-manager.service';
import { ThinBaseComponent }  from '../../shared/thinbase.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../../app.global-state';
import { FocusMeDirective } from '../../shared/focus-me.directive';

@Component({
    selector: 'thda-help-ack',
    templateUrl: './help-ack.component.html',
    styleUrls: ['../help.component.scss'],
    imports: [FocusMeDirective, RouterLink, RouterLinkActive]
})
export class HelpAckComponent extends ThinBaseComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private globalState = inject(GlobalState);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    signalFocusToTitle: boolean = false;

    ngOnInit() {
        var leadingPiece: string = "Help Page, Acknowledgments";
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
