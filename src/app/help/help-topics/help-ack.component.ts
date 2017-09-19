import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../../title-manager.service';

@Component({
    selector: 'thda-help-ack',
    templateUrl: './help-ack.component.html',
    styleUrls: ['../help.component.scss']
})
export class HelpAckComponent implements OnInit {

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService) {
    }

    ngOnInit() {
        this.titleManagerService.setTitle("Help Page, Acknowledgments, The ScienceMakers Digital Archive");
    }

}
