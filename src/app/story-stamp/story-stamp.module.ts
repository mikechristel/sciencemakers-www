import { NgModule }       from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { StoryStampComponent } from './story-stamp.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
    imports: [
        SharedModule,
        TooltipModule.forRoot()
    ],
    declarations: [
        StoryStampComponent
    ],
    exports: [StoryStampComponent]
})
export class StoryStampModule { }