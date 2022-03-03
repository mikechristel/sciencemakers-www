import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HistoryMakersComponent } from './historymakers.component';

export const historymakersRoutes: Routes = [
    { path: 'all', component: HistoryMakersComponent }
];

export const historymakersRouting: ModuleWithProviders<any> = RouterModule.forChild(historymakersRoutes);
