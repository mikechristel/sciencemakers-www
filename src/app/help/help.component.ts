import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router, Params } from '@angular/router';

import { TitleManagerService } from '../title-manager.service';
import { MenuService } from '../menu/menu.service'

@Component({
    selector: 'thda-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
    helpPageTitle: string;
    helpPageTitleLong: string;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private titleManagerService: TitleManagerService,
        private menuService: MenuService) {
    }

    ngOnInit() {
        this.menuService.setSearchOption('story');
        this.helpPageTitle = "Help Page";
        this.helpPageTitleLong = "Help Page, The ScienceMakers Digital Archive";
        this.titleManagerService.setTitle(this.helpPageTitleLong);
    }

}
