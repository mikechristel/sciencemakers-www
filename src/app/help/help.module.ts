import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { HelpComponent } from './help.component';
import { HelpSearchComponent } from './help-topics/help-search.component';
import { HelpSearchInOneComponent } from './help-topics/help-search-in-one.component';
import { HelpAckComponent } from './help-topics/help-ack.component';
import { HelpCiteComponent } from './help-topics/help-cite.component';
import { HelpDataComponent } from './help-topics/help-data.component';
import { HelpFacetsComponent } from './help-topics/help-facets.component';
import { HelpPlaylistComponent } from './help-topics/help-playlist.component';
import { HelpPrivacyComponent } from './help-topics/help-privacy.component';
import { HelpPublicationsComponent } from './help-topics/help-publications.component';
import { HelpTermsComponent } from './help-topics/help-terms.component';
import { helpRouting } from './help.routing';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        helpRouting
    ],
    declarations: [
        HelpComponent,
        HelpSearchComponent,
        HelpSearchInOneComponent,
        HelpAckComponent,
        HelpCiteComponent,
        HelpDataComponent,
        HelpFacetsComponent,
        HelpPlaylistComponent,
        HelpPrivacyComponent,
        HelpPublicationsComponent,
        HelpTermsComponent
    ]
})
export class HelpModule { }
