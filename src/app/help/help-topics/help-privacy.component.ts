import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-privacy',
    templateUrl: './help-privacy.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpPrivacyComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Privacy Statement, The ScienceMakers Digital Archive");
    }

}
