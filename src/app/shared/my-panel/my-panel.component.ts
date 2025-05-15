import { Component, Output, EventEmitter, input } from '@angular/core';
import { BaseComponent } from '../base.component';
import { NgClass } from '@angular/common';
import { FocusMeDirective } from '../focus-me.directive';

// NOTE: thanks to https://training.fabiobiondi.io/2017/07/10/create-an-accordion-component-in-angular-parent-children-communication/
// inspiring this "panel", to replace former reliance on Bootstrap 3 panel behavior via JS.
// Use:
//  <my-panel *ngFor="let facet of ManyFacets"
//    [title]="facet.name" [opened]="facet.opened"
//    (toggle)="facet.opened = !facet.opened"> {{facet.desc}} </my-panel>
//
// Accessibility concerns raised the need to set the focus programmatically to the button controlling the display
// of contents within.  That is accomplished through the setFocusToButtonHoldingMenu property: when set to true,
// it will trigger a focus() action on the button.

@Component({
    selector: 'my-panel',
    templateUrl: './my-panel.component.html',
    styleUrls: ['./my-panel.component.scss'],
    imports: [NgClass, FocusMeDirective]
})

export class MyPanelComponent extends BaseComponent {
  readonly opened = input<boolean>(false);
  readonly title = input<string>(undefined);
  readonly markAsGrandparent = input<boolean>(false);
  readonly overrideToH4Nesting = input<boolean>(false);
  readonly markAsReverse = input<boolean>(false);
  readonly setFocusToButtonHoldingMenu = input<boolean>(false);

  @Output() toggle: EventEmitter<any> = new EventEmitter<any>();

    constructor() {
        super();
    }
}
