import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-user-settings',
    templateUrl: './help-user-settings.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpUserSettingsComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, User Settings, The HistoryMakers Digital Archive");
    }

}
