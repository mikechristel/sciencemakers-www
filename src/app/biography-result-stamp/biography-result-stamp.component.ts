import { Component, Input, input } from '@angular/core';
// NOTE: Input is original, input new but "ng generate @angular/core:signal-input-migration" (March 2025) could not fully remove Input: both needed from the core.

import { BriefBio } from '../historymakers/brief-bio';
import { environment } from '../../environments/environment';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { ScrollToMeDirective } from '../shared/scroll-to-me.directive';

@Component({
    selector: 'thda-bio-res',
    templateUrl: './biography-result-stamp.component.html',
    styleUrls: ['./biography-result-stamp.component.scss'],
    imports: [RouterLinkActive, NgClass, RouterLink, ScrollToMeDirective, DatePipe]
})

// This class is used to present a single biography, i.e., a single interviewee, in a presumed grid/list of biography RESULTS
// from a biography search.  NOTE: it is very similar to biography-stamp (thda-bio) and perhaps later can be merged with that
// class BiographyStampComponent if the differences in renderings are not too challenging for such a merge.
// It takes as input the biography details in the form of a BriefBio object, and the ID of whatever biography might be
// selected to appropriately focus the selected biography in a grid/list.
export class BiographyResultStampComponent {
    // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
    //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
    //  and migrating would break narrowing currently.
    @Input() bio: BriefBio;
    readonly selectedBiographyID = input<string>(undefined, { alias: "selectedID" });
    readonly cardView = input<boolean>(undefined);

    public myMediaBase: string;

    constructor() {
      this.myMediaBase = environment.mediaBase;
    }

    isSelected(bio: BriefBio) {
        return bio.document.accession == this.selectedBiographyID();
    }
}
