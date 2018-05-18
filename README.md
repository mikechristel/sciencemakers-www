# sciencemakers-www
The ScienceMakers Digital Video Archive website is a web-based single page application (SPA) built with [Angular](https://angular.io/), [TypeScript](https://www.typescriptlang.org/), and [Bootstrap](https://getbootstrap.com/) for responsive layout.

## Installation
Run `npm install` in the root of the project directory to install the necessary build tools and depedencies.

## Configuration

There must be an env.json file in the assets folder with a value identifying which configuration to use.
The value of the "myEnv" key, e.g., "production", indicates there must be a config.production.json file also in assets.
This file is NOT part of the repository, as you must specify your own API to the Azure Services feeding this interface, and your own media files URL base string.
The file config.production.json will have content like the following:
{
  "serviceBase" : "https://YourDomainAndPathForAPIServiceHere/",
  "mediaBase" : "https://YourDomainAndPathForMediaFilesHere/"
}

You may have a config.development.json with different values, and set env.json differently between development and production builds.

## Build and Run

Please note that with the addition of the authentication framework, the number of possible build options has changed. This number may go down again in the future once authentication goes into production.

### Development

Build is handled by Angular CLI, for more information see: https://cli.angular.io/

Run `ng serve` to run the application locally during development.

Optionally, run `ng serve --hmr -e=hmr` (or simply `npm run hmr`) to run the application locally with Hot Module Replacement during development.

To debug with authentication enabled: 
ng serve --env=devauth

### Production

Set env.json to production as needed.  Add in correct Google Analytics key to index.html as needed.  
Run 'ng build --env=prod --target=production' to build locally.  Deploy outside of the gitHub framework as necessary.

## Browsers

### Tested
We actively test the latest versions of the following browsers:

#### iOS
- Safari

#### Android
- Chrome

#### macOS
- Chrome
- Firefox
- Safari

#### Windows 10
- Chrome
- Edge
- IE

### Recommended
We primarily develop using Chrome. As a result, we feel it is the browser we best support and is our recommendation for the best user experience.

## Known Issues
* There may be minor issues with image scaling in Microsoft Edge and Microsoft Internet Explorer as they do not support the CSS `object-fit` property.
* The Renderer.invokeElementMethod is deprecated with no current replacement. This method is used to scroll the selected search result into view when returning from the details view.
* The video player currently has accessibility issues. We are working with the owners of Videogular2 to resolve this issue, and will hopefully have it resolved soon.

## Resources 
Font sizing has been implemented using rems and ems. For more information see: https://css-tricks.com/rems-ems/.

## Dependencies
* [Angular](https://angular.io/) - Web application framework
* [Angular CLI](https://cli.angular.io/) - A command line interface for Angular
* [angular-hmr](https://github.com/gdi2290/angular-hmr) - Angular Hot Module Replacement. Used in development when running `ng serve --hmr -e=hmr`.
* [ngx-bootstrap](https://valor-software.com/ngx-bootstrap/#/) - An Angular 2 version of the popular UI library. Only the Tooltip module is imported into this project.
* [ngx-clipboard](https://www.npmjs.com/package/ngx-clipboard) - A clipboard copy directive used to copy My Playlist url.
* [ng2-dragula](https://valor-software.com/ng2-dragula/) - A drag and drop library used to rearrange stories in My Playlist.
* [ngx-scroll-to](https://github.com/nicky-lenaers/ngx-scroll-to) - A scrolling library that addresses in-page hash linking with Angular routing. Used for the back-to-top and skip-to-main links.
* [Videogular2](https://videogular.github.io/videogular2/) - An HTML5 video player for Angular 2.
