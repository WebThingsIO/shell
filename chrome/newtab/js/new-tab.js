/**
 * New Tab.
 * 
 * New tab page. Displays app icons of pinned apps.
 */
const NewTab = {
  APP_ICON_SIZE: 64,

  start: function() {
    console.log('Starting new tab page...');
    this.appsElement = document.getElementById('apps');
    // Start database, app manager and views.
    Database.start().then(() => {
      this.webApps = new WebApps(Database);
      return this.webApps.start();
    }).then(() => {
      this.showApps();
    });
  },

  /**
   * Show app icons for all pinned apps.
   */
  showApps: function() {
    const webApps = this.webApps.list();
    webApps.forEach((webApp, webAppId, map) => {
      const appIcon = new AppIcon(
        webApp.id,
        webApp.getBestIconUrl(this.APP_ICON_SIZE),
        webApp.getShortestName(),
        webApp.startUrl);
      this.appsElement.insertAdjacentElement('beforeend', appIcon);
    });
  }
}

/**
  * Start on load.
  */
window.addEventListener('load', function newtab_onLoad() {
  window.removeEventListener('load', newtab_onLoad);
  NewTab.start();
});