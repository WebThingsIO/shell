/**
 * Web App Manager.
 * 
 * Manages pinned web apps.
 */
class WebApps {
  apps = new Map();

  /**
   * Constructor.
   * 
   * @param {Database} database Database for saving apps.
   */
  constructor(database) {
    this.db = database;
  }

  /**
   * Start the app manager.
   * 
   * @returns {Promise} A Promise which resolves on successful initialisation.
   */
  async start() {
    console.log('Starting app manager...');
    return this.refreshAppList();
  }

  /**
   * Pin a web app.
   * 
   * Saves an app manifest in the database.
   * 
   * @param {String} manifestUrl The URL from which the manifest was retrieved.
   * @param {String} documentUrl The URL of the document from which the manifest was linked.
   * @param {Object} manifest The raw content of the manifest parsed as JSON.
   * @returns {Promise<WebApp>} A Promise that resolves with a WebApp on successful creation.
   * @throws {Error} with message 'InvalidManifest' or 'PinAppFailed'.
   */
  async pin(manifestUrl, documentUrl, manifest) {
    // Try to parse id from manifest
    let webApp;
    try {
      webApp = new WebApp(manifest, manifestUrl, documentUrl);
    } catch(error) {
      console.error('Failed to parse web app manifest retrieved from URL ' + manifestUrl);
      throw new Error('InvalidManifest');
    }
    const id = webApp.id;

    try {
      await this.db.createApp(id, manifestUrl, documentUrl, manifest);
      await this.refreshAppList();
      return webApp;
    } catch (error) {
      console.error('Error pinning app with id: ' + id);
      console.error(error);
      throw new Error('PinAppFailed');
    }
  }

  /**
   * Unpin the app with the given ID.
   * 
   * @param {string} id The ID of the app to unpin.
   */
  async unpin(id) {
    try {
      await this.db.deleteApp(id);
      await this.refreshAppList();
      return;
    } catch(error) {
      console.error('Error unpinning app with id: ' + id);
      console.error(error);
      throw new Error('UnpinAppFailed');
    }
  }

  /**
   * Get the current list of pinned apps.
   * 
   * @returns {Map} A Map of app IDs to WebApp objects.
   */
  list() {
    return this.apps;
  }

  /**
   * Refresh the list of apps in memory.
   */
  async refreshAppList() {
    this.apps.clear();
    let appRecords = new Map();
    try {
      appRecords = await this.db.listApps();
    } catch(error) {
      console.error('Error retrieving list of apps from database: ' + error);
    }
    appRecords.forEach((appRecord, appId) => {
      try {
        let webApp = new WebApp(appRecord.manifest, appRecord.manifestUrl, 
          appRecord.documentUrl);
        this.apps.set(appId, webApp);
      } catch(error) {
        console.error('Failed to instantiate web app with id ' + appId + ' ' + error);
      }
    });
    return;
  }

  /**
   * Get the pinned app whose navigation scope most closely matches the given URL, if any.
   * 
   * @param {String} url The page URL to check against navigation scopes.
   * @returns {WebApp|null} The app with the closest matching navigation scope, if any.
   */
  match(url) {
    let closestMatchingApp = null;
    this.apps.forEach((app, appId) => {
      if (app.isWithinScope(url, app.scope)) {
        if (closestMatchingApp == null) {
          closestMatchingApp = app;
        }
        else if (closestMatchingApp && closestMatchingApp.scope.length > app.scope.length) {
          closestMatchingApp = app;
        }
      }
    }, this);
    return closestMatchingApp;
  }
}