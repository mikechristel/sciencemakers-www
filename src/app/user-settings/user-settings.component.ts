import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { ActivatedRoute, Router, Params, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntil } from "rxjs/operators";

import { TitleManagerService } from '../shared/title-manager.service';
import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';
import { BaseComponent } from '../shared/base.component';
import {LiveAnnouncer} from '@angular/cdk/a11y'; // used to read changes to set title
import { GlobalState } from '../app.global-state';
import { FocusMeDirective } from '../shared/focus-me.directive';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'thda-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.scss'],
    imports: [FocusMeDirective, RouterLink, RouterLinkActive, FormsModule]
})
export class UserSettingsComponent extends BaseComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private globalState = inject(GlobalState);
    private titleManagerService = inject(TitleManagerService);
    private userSettingsManagerService = inject(UserSettingsManagerService);
    private liveAnnouncer = inject(LiveAnnouncer);

    private changeDetectorRef = inject(ChangeDetectorRef);

    settingsPageTitle: string;
    settingsPageTitleLong: string;
    signalFocusToTitle: boolean = false; // is used in html rendering of this component

    defaultAutoPlay: boolean;
    defaultAutoAdvance: boolean;
    showBiographyLastNameFacetFilter: boolean;
    showBiographyDecadeOfBirthFacetFilter: boolean;
    showBiographyBirthStateFacetFilter: boolean;
    showBiographyJobTypeFacetFilter: boolean;
    showStoryUSStateFacetFilter: boolean;
    showStoryOrganizationFacetFilter: boolean;
    showStoryDecadeFacetFilter: boolean;
    showStoryYearFacetFilter: boolean;
    showStoryJobTypeFacetFilter: boolean;
    showStoryDecadeOfBirthFacetFilter: boolean;

    constructor() {

        super();  // for BaseComponent extension (brought in to cleanly unsubscribe from subscriptions)
        const userSettingsManagerService = this.userSettingsManagerService;

        userSettingsManagerService.autoplayVideo$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.defaultAutoPlay = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.autoadvanceVideo$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.defaultAutoAdvance = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });

        // Settings related to visibility of certain filters for biography sets:
        userSettingsManagerService.showBiographyBirthStateFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showBiographyBirthStateFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showBiographyDecadeOfBirthFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showBiographyDecadeOfBirthFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showBiographyJobTypeFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showBiographyJobTypeFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showBiographyLastNameFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showBiographyLastNameFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });

        // Settings related to visibility of certain filters for story sets:
        userSettingsManagerService.showStoryUSStateFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryUSStateFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showStoryOrganizationFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryOrganizationFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showStoryDecadeFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryDecadeFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showStoryYearFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryYearFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showStoryJobTypeFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryJobTypeFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
        userSettingsManagerService.showStoryDecadeOfBirthFacetFilter$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((value) => {
          this.showStoryDecadeOfBirthFacetFilter = value;
          this.changeDetectorRef.markForCheck(); // trigger UI update in Angular 21 zoneless world
        });
    }

    ngOnInit() {

        this.defaultAutoPlay = this.userSettingsManagerService.currentAutoplay();
        this.defaultAutoAdvance = this.userSettingsManagerService.currentAutoadvance();

        this.showBiographyBirthStateFacetFilter = this.userSettingsManagerService.currentShowBiographyBirthStateFacetFilter();
        this.showBiographyDecadeOfBirthFacetFilter = this.userSettingsManagerService.currentShowBiographyDecadeOfBirthFacetFilter();
        this.showBiographyJobTypeFacetFilter = this.userSettingsManagerService.currentShowBiographyJobTypeFacetFilter();
        this.showBiographyLastNameFacetFilter = this.userSettingsManagerService.currentShowBiographyLastNameFacetFilter();
        this.showStoryUSStateFacetFilter = this.userSettingsManagerService.currentShowStoryUSStateFacetFilter();
        this.showStoryOrganizationFacetFilter = this.userSettingsManagerService.currentShowStoryOrganizationFacetFilter();
        this.showStoryDecadeFacetFilter = this.userSettingsManagerService.currentShowStoryDecadeFacetFilter();
        this.showStoryYearFacetFilter = this.userSettingsManagerService.currentShowStoryYearFacetFilter();
        this.showStoryJobTypeFacetFilter = this.userSettingsManagerService.currentShowStoryJobTypeFacetFilter();
        this.showStoryDecadeOfBirthFacetFilter = this.userSettingsManagerService.currentShowStoryDecadeOfBirthFacetFilter();

        this.settingsPageTitle = "User Settings";
        this.settingsPageTitleLong = "User Settings, ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.settingsPageTitleLong);
        this.liveAnnouncer.announce("User Settings"); // NOTE: using LiveAnnouncer to eliminate possible double-speak
        if (this.globalState.IsInternalRoutingWithinSPA) {
            this.globalState.IsInternalRoutingWithinSPA = false;
            // Set default focus to the title for this route, since we did internally route
            // in the SPA (single page application)
            // (as it is the target for skip-to-main content as well)
            this.signalFocusToTitle = true;
        }
    }

    onAutoPlayChange(isChecked: boolean) {
      this.userSettingsManagerService.updateAutoPlay(isChecked);
    }

    onAutoAdvanceChange(isChecked: boolean) {
      this.userSettingsManagerService.updateAutoAdvance(isChecked);
    }

    onShowBiographyBirthStateFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowBiographyBirthStateFacetFilter(isChecked);
    }
    onShowBiographyLastNameFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowBiographyLastNameFacetFilter(isChecked);
    }
    onShowBiographyDecadeOfBirthFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowBiographyDecadeOfBirthFacetFilter(isChecked);
    }

    onShowStoryUSStateFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowStoryUSStateFacetFilter(isChecked);
    }
    onShowStoryOrganizationFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowStoryOrganizationFacetFilter(isChecked);
    }
    onShowStoryDecadeFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowStoryDecadeFacetFilter(isChecked);
    }
    onShowStoryYearFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowStoryYearFacetFilter(isChecked);
    }
    onShowStoryDecadeOfBirthFacetFilterChange(isChecked: boolean) {
      this.userSettingsManagerService.updateShowStoryDecadeOfBirthFacetFilter(isChecked);
    }

}
