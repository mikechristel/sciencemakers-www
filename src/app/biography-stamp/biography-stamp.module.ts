import { NgModule }       from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { BiographyStampComponent } from './biography-stamp.component';

@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        BiographyStampComponent
    ],
    exports: [BiographyStampComponent]
})
export class BiographyStampModule { }