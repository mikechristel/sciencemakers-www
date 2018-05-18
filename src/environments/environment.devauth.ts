// For debugging with authentication enabled

export const environment = {
  production: false,
  hmr: false,
  // Runtime configuruation
  //serviceBase: "http://localhost:65001/api/",
  requireAuthentication: true,
  serviceBase: "api/",
  mediaBase: "https://thmdaprodmedia.blob.core.windows.net/media/",
  firstInterviewYear: 2001
};
