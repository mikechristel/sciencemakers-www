import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { BiographyStorySetComponent } from './biography-storyset.component';
import { biographyStorySetRouting } from './biography-storyset.routing';

import { StoryStampModule } from '../story-stamp/story-stamp.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        SharedModule,
        StoryStampModule,
        biographyStorySetRouting
    ],
    declarations: [
        BiographyStorySetComponent
    ]
})
export class BiographyStorySetModule { }
