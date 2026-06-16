import { Component, Output, EventEmitter, Inject, input } from '@angular/core';
import { BriefBio } from '../historymakers/brief-bio';
import { environment } from '../../environments/environment';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { ScrollToMeDirective } from '../shared/scroll-to-me.directive';

@Component({
    selector: 'thda-bio',
    templateUrl: './biography-stamp.component.html',
    styleUrls: ['./biography-stamp.component.scss'],
    imports: [RouterLinkActive, RouterLink, ScrollToMeDirective]
})

// This class is used to present a single biography, i.e., a single interviewee, in a presumed card grid of biographies.
// It takes as input the biography details in the form of a BriefBio object, and the ID of whatever biography might be
// selected to appropriately decorate the selected biography in a grid.
export class BiographyStampComponent {
    readonly bio = input<BriefBio>();
    readonly selectedBiographyID = input<string>(undefined, { alias: "selectedID" });

    public myMediaBase: string;

    constructor() {
      this.myMediaBase = environment.mediaBase;
    }

    isSelected(bio: BriefBio) {
        return bio.document.accession == this.selectedBiographyID();
    }
}
