import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../title-manager.service';
import { UserSettingsManagerService } from '../user-settings/user-settings-manager.service';
import { Subscription }   from 'rxjs/Subscription';

@Component({
    selector: 'thda-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {

    private autoPlaySubscription: Subscription;
    private autoAdvanceSubscription: Subscription;

    settingsPageTitle: string;
    settingsPageTitleLong: string;

    defaultAutoPlay: boolean;
    defaultAutoAdvance: boolean;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService,
        private userSettingsManagerService: UserSettingsManagerService) {
          this.autoPlaySubscription = userSettingsManagerService.autoplayVideo$.subscribe((value) => {
            this.defaultAutoPlay = value;
          })
          this.autoAdvanceSubscription = userSettingsManagerService.autoadvanceVideo$.subscribe((value) => {
            this.defaultAutoAdvance = value;
          })
    }

    ngOnInit() {
        this.defaultAutoPlay = this.userSettingsManagerService.currentAutoplay();
        this.defaultAutoAdvance = this.userSettingsManagerService.currentAutoadvance();
        this.settingsPageTitle = "Settings Page";
        this.settingsPageTitleLong = "Settings Page, The HistoryMakers Digital Archive";
        this.titleManagerService.setTitle(this.settingsPageTitleLong);
    }

    onAutoPlayChange(isChecked: boolean) {
      this.userSettingsManagerService.updateAutoPlay(isChecked);
    }

    onAutoAdvanceChange(isChecked: boolean) {
      this.userSettingsManagerService.updateAutoAdvance(isChecked);
    }
}
