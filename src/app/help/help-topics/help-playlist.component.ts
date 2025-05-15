import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, Router, Params, RouterLinkActive, RouterLink } from '@angular/router';

import { TitleManagerService } from '../../shared/title-manager.service';
import { ThinBaseComponent }  from '../../shared/thinbase.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../../app.global-state';
import { FocusMeDirective } from '../../shared/focus-me.directive';

@Component({
    selector: 'thda-help-playlist',
    templateUrl: './help-playlist.component.html',
    styleUrls: ['../help.component.scss'],
    imports: [FocusMeDirective, RouterLinkActive, RouterLink]
})
export class HelpPlaylistComponent extends ThinBaseComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private globalState = inject(GlobalState);
    private titleManagerService = inject(TitleManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    // NOTE: "Playlist" retired in favor of "My Clips" but name of component here kept its legacy name of HelpPlaylistComponent.
    signalFocusToTitle: boolean = false;

    ngOnInit() {
        var leadingPiece: string = "Help Page, My Clips Creation and Sharing";
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
