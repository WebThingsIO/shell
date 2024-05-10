/**
 * Web App Manager.
 * 
 * Manages installed web apps.
 */
const WebApps = {

  /**
   * A Map of app IDs to WebApp objects.
   */
  apps: new Map(),

  /**
   * Start the app manager.
   * 
   * @param {Database} database Database for saving apps.
   */
  start: async function(database) {
    console.log('Starting app manager...');
    this.db = database;
    this.db.listApps().then((appRecords) => {
      // TODO: figure out where ID comes from.
      appRecords.forEach((appRecord, appId) => {
        try {
          let webApp = new WebApp(appRecord.manifest, appRecord.manifestUrl, 
            appRecord.documentUrl);
          this.apps.set(appId, webApp);
        } catch {
          console.error('Failed to instantiate web app with id ' + appId);
        }
      });
    });
  },

  /**
   * Get the current list of installed apps.
   * 
   * @returns {Map} A Map of app IDs to WebApp objects.
   */
  getApps: function() {
    return this.apps;
  }
}