import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { StorySetComponent } from './storyset.component';
import { storysetRouting } from './storyset.routing';

import { StoryStampModule } from '../story-stamp/story-stamp.module';

import { SharedModule } from '../shared/shared.module';

import { DragulaService, DragulaModule } from 'ng2-dragula/ng2-dragula';

import { ClipboardModule } from 'ngx-clipboard';

@NgModule({
    imports: [
        SharedModule,
        StoryStampModule,
        storysetRouting,
        DragulaModule,
        ClipboardModule
    ],
    declarations: [
        StorySetComponent
    ]
})
export class StorySetModule { }