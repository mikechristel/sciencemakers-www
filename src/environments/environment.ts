// Default Environment (local development)
// The build system defaults to the development environment which uses `environment.ts`.
// Environment can be specified using the `--configuration` flag, ex: `ng build --configuration=production`.
// The list of which environment maps to which file can be found in `angular.json`.
export const environment = {
  production: false,
  // client configuration
  serviceBase: "https://localhost:5001/api/",  // Locally hosted API
  mediaBase: "https://daproductionstorage.blob.core.windows.net/media/",
  firstInterviewYear: 1993
};
