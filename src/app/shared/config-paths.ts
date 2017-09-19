import {InjectionToken} from '@angular/core';

// NOTE: this file exists to tie in service and media path bases
// defined in external JS config files into the Angular framework
// using Angular's Dependency Injection (DI).  See how these are tied
// into providers in app.module.ts for use by all that import the
// definition, via DI in their constructors.
// Reference: http://stackoverflow.com/questions/35215112/pass-page-global-variables-into-angular2-app-for-use-with-services
// ...with caveat that InjectionToken replaces OpaqueToken for Angular 4.0.0 (March 2017+).
export let ServiceBase: any = new InjectionToken('myServiceBase');
export let MediaBase: any = new InjectionToken('myMediaBase');
