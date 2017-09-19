import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { BiographyAdvancedSearchComponent } from './bio-advanced-search.component';
import { biographyAdvancedSearchRouting } from './bio-advanced-search.routing';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        biographyAdvancedSearchRouting
    ],
    declarations: [
        BiographyAdvancedSearchComponent
    ]
})
export class BiographyAdvancedSearchModule { }
