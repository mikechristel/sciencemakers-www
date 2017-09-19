import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { StoryAdvancedSearchComponent } from './story-advanced-search.component';
import { storyAdvancedSearchRouting } from './story-advanced-search.routing';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        storyAdvancedSearchRouting
    ],
    declarations: [
        StoryAdvancedSearchComponent
    ]
})
export class StoryAdvancedSearchModule { }
