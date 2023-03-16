# sciencemakers-www
The ScienceMakers Digital Video Archive website is a web-based single page application (SPA) built with [Angular](https://angular.io/), [TypeScript](https://www.typescriptlang.org/), and Angular Flex Layout for responsive layout.

## Installation
Run `npm install` in the root of the project directory to install the necessary build tools and depedencies.

## Build and Deploy

> **NOTE: All of the build and deployment configurations have changed as of December 11, 2020.  Please read carefully.**

### Build Environments and Associated Resources

The application build is handled by [Angular CLI](https://cli.angular.io/), refer to the [documentation](https://github.com/angular/angular-cli/wiki) for further details.

**IMPORTANT: As of December 2020 the development environment requires a locally hosted API**
 
All hosted versions of the Digital Archive API require authentication and are inaccessible to a locally hosted client, therefore the default development configuration requires the API to be locally hosted at https://localhost:5001/api. This is the default debug/development configuration for the .NET API.

There are two primary configuration environments as follows:

| Environment | Build Command                         | Build Target       | Client URL                               | Configured serviceBase      | Configured mediaBase                                     |
|:------------|:--------------------------------------|:-------------------|:-----------------------------------------|:----------------------------|:---------------------------------------------------------|
| (default)   | `ng serve`                            | (development)      | http://localhost:4200/                   | https://localhost:5001/api | https://daproductionstorage.blob.core.windows.net/media/ |
| production  | `ng build --configuration=production` | sm-production-www  | https://sm.thehistorymakers.org          | api/                        | https://daproductionstorage.blob.core.windows.net/media/ |

### Deploying to Azure

**NOTES**
1) Continuous Deployment (CD) is not currently available; production archive must be updated manually.
2) For authentication to work properly, the Angular application must be bundled and deployed together with the .NET API.
This .NET API should be locked down to "ScienceMakers only" for this ScienceMakers Digital Archive.
3) Deployment is handled by Visual Studio 2019, refer to the digital-archive-api documentation for publishing specifics.

## Browsers

### Tested
We actively test the latest versions of the Chrome and Safari browsers, with lesser testing of Edge and Firefox.  

### Recommended
We primarily develop using Chrome. As a result, we feel it is the browser we best support and is our recommendation for the best user experience.

## Known Issues
* IE support has been retired in 2020.

## Resources 
Font sizing has been implemented using rems and ems. For more information see: https://css-tricks.com/rems-ems/.

## Dependencies
* [Angular](https://angular.io/) - Web application framework (version 9, from 2020)
* [Angular CLI](https://cli.angular.io/) - A command line interface for Angular


