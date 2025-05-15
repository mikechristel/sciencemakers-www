import { Directive, ElementRef, Input, Renderer2, inject } from '@angular/core';

// NOTE: inspired by https://angular.io/docs/ts/latest/guide/attribute-directives.html, but without
// taking into account the cautions of http://stackoverflow.com/questions/36108995/what-are-some-good-alternatives-to-accessing-the-dom-using-nativeelement-in-angu
// Using https://angular.io/docs/ts/latest/guide/structural-directives.html to make it more like what we want....
// Goal: scroll a certain DOM element into view!
@Directive({ selector: '[thdaScrollToMe]' })
export class ScrollToMeDirective {
    private _renderer = inject(Renderer2);

    private el: HTMLElement;

    constructor() {
 const el = inject(ElementRef);
 this.el = el.nativeElement; }

    // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
    //  Accessor inputs cannot be migrated as they are too complex.
    @Input() set thdaScrollToMe(condition: boolean) {
        if (condition && this.el) {
            this.el.scrollIntoView(false); // this makes call web worker safe, instead of directly calling this.el.scrollIntoView();
            this.el.focus(); // this makes call web worker safe, instead of directly calling this.el.scrollIntoView();
        }
    }
}
