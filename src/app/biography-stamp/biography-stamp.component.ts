import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { BriefBio } from '../historymakers/brief-bio';
import { environment } from '../../environments/environment';

@Component({
    selector: 'thda-bio',
    templateUrl: './biography-stamp.component.html',
    styleUrls: ['./biography-stamp.component.scss'],
})

// This class is used to present a single biography, i.e., a single interviewee, in a presumed grid/list of biographies.
// It takes as input the biography details in the form of a BriefBio object, and the ID of whatever biography might be
// selected to appropriately decorate the selected biography in a grid/list.
// It emits the onSelected event when it fires its onSelect event.
// See https://angular.io/docs/ts/latest/cookbook/component-communication.html for more on component communication.
export class BiographyStampComponent {
    @Input() bio: BriefBio;
    @Input('selectedID') selectedBiographyID: string;
    @Input() cardView: boolean;
    @Output() onSelected = new EventEmitter<BriefBio>();

    public myMediaBase: string;

    constructor() {
      this.myMediaBase = environment.mediaBase;
    }

    isSelected(bio: BriefBio) {
        return bio.document.accession == this.selectedBiographyID;
    }

    onSelect(hm: BriefBio) {
        this.onSelected.emit(hm);
    }
}
