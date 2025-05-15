import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router, Params, RouterLink, RouterLinkActive } from '@angular/router';

import { TitleManagerService } from '../shared/title-manager.service';
import { ThinBaseComponent }  from '../shared/thinbase.component';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { FocusMeDirective } from '../shared/focus-me.directive'; // used to read changes to set title

@Component({
    selector: 'thda-not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [FocusMeDirective, RouterLink, RouterLinkActive]
})
export class RouteNotFoundComponent extends ThinBaseComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    signalFocusToTitle: boolean = false;

    ngOnInit() {
        var title: string = "Page Not Found, ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(title);
        this.liveAnnouncer.announce(title); // NOTE: using LiveAnnouncer to eliminate possible double-speak

        // NOTE: no expectation, and hence no code, to set focus to title
        // because of this.globalState.IsInternalRoutingWithinSPA being true since there
        // should be no internal routing in the single page application (SPA) to a not-found route.
    }

}
