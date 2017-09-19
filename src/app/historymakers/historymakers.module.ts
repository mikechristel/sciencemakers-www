import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';

import { HistoryMakersComponent } from './historymakers.component';
import { BiographyStampModule } from '../biography-stamp/biography-stamp.module';

import { historymakersRouting } from './historymakers.routing';

import { SharedModule } from '../shared/shared.module';

@NgModule({
    imports: [
        SharedModule,
        BiographyStampModule,
        historymakersRouting
    ],
    declarations: [
        HistoryMakersComponent
    ]
})
export class HistoryMakersModule { }