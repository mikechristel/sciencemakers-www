# sciencemakers-www
The ScienceMakers Digital Video Archive website is a web-based single page application (SPA) built with [Angular](https://angular.io/), [TypeScript](https://www.typescriptlang.org/), and Angular Flex Layout for responsive layout.

## Installation
Run `npm install` in the root of the project directory to install the necessary build tools and depedencies.

## Configuration

The environments folder is underspecified.  
The value of the "myEnv" key, e.g., "prod", indicates there must be a config.prod.json file also in assets.
This file is NOT part of the repository, as you must specify your own API to the Azure Services feeding this interface, and your own media files URL base string.
The file config.prod.json will have content like the following:
{
  "serviceBase" : "https://YourDomainAndPathForAPIServiceHere/",
  "mediaBase" : "https://YourDomainAndPathForMediaFilesHere/"
}

You may have a config.development.json with different values, and set env.json differently between development and production builds.

## Build and Run

Please note that with the addition of the authentication framework, the number of possible build options has changed. This number may go down again in the future once authentication goes into production.

### Development

Build is handled by [Angular CLI](https://cli.angular.io/) for details please refer to the [documentation](https://github.com/angular/angular-cli/wiki).

To run the application locally during development:
```
ng serve
```

To use optional Hot Module Replacement during development:
```
ng serve --hmr --configuration=hmr
```

Or more simply:
```
npm run hmr
``` 

To debug with authentication enabled:
```
ng serve --configuration=devauth
```

### Production

**NOTE:** Commits to the main branch are automatically deployed to the the [Processing (test) Site](https://thmda-test-www.azurewebsites.net). Please make sure your code will compile for the test site prior to pushing your changes to the GitHub repository.

To build for the [Processing (test) Site](https://thmda-test-www.azurewebsites.net):
```
ng build --prod --configuration=test
```

To build for the Demo Site:
```
ng build --prod --configuration=demo
```

To build for either the [Production](https://thmda-prod-www.azurewebsites.net) or [Demo](https://demo.thehistorymakers.org) Site:
```
ng build --prod --configuration=prod
```
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

### Recommended
We primarily develop using Chrome. As a result, we feel it is the browser we best support and is our recommendation for the best user experience.

## Known Issues
* IE support has been retired in 2020.

## Resources 
Font sizing has been implemented using rems and ems. For more information see: https://css-tricks.com/rems-ems/.

## Dependencies
* [Angular](https://angular.io/) - Web application framework (version 9, from 2020)
* [Angular CLI](https://cli.angular.io/) - A command line interface for Angular
* [angular-hmr](https://github.com/gdi2290/angular-hmr) - Angular Hot Module Replacement. Used in development when running `ng serve --hmr -configuration=hmr`.

