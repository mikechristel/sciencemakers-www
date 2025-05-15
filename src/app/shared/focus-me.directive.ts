import { Directive, ElementRef, Input, Renderer2, inject } from '@angular/core';

// NOTE: inspired by https://coderanch.com/t/675897/languages/programmatically-manage-focus-Angular-app
// and https://blog.angular-university.io/angular-debugging/ and https://matthewdavis.io/auto-focus-with-angular-7-the-directive/
// Goal: focus a certain DOM element!
@Directive({ selector: '[thdaIsFocused]' })
export class FocusMeDirective {
    private _renderer = inject(Renderer2);

    private el: HTMLElement;

    constructor() {
        const el = inject(ElementRef);

        this.el = el.nativeElement;
    }

    // TODO: Skipped for migration with "ng generate @angular/core:signal-input-migration" (March 2025) because:
    //  Accessor inputs cannot be migrated as they are too complex.
    @Input() set thdaIsFocused(condition: boolean) {
        if (condition && this.el) {
            this.el.focus(); // this makes call web worker safe
        }
    }
}
