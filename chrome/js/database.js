/**
 * Database.
 * 
 * A local IndexedDB database for storing apps, bookmarks and history.
 */
const Database = {
  DB_NAME: 'database',

  db: null, // The database object once opened

  /**
   * Start the database.
   * 
   * @returns {Promise} Promise that resolves when database opens successfully.
   */
  start: function() {
    console.log('Opening database...');

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.DB_NAME, 1);

      request.onerror = (event) => {
        console.error('Error opening database');
        reject();
      }

      request.onsuccess = (event) => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = this.upgrade.bind(this);
    });
  },

  /**
   * Upgrade the database.
   * 
   * Create object stories and indices etc.
   * 
   * @param {IDBVersionChangeEvent} event The version change event.
   */
  upgrade: function(event) {
    console.log('Upgrading database...');
    const db = event.target.result;
    const oldVersion = event.oldVersion;

    // Version 1
    if(oldVersion < 1) {
      const appsObjectStore = db.createObjectStore('apps');

      appsObjectStore.transaction.addEventListener('complete', (event) => {
        this.populateDefaultApps();
      });
  
      appsObjectStore.transaction.addEventListener('error', (event) => {
        console.error('Error creating object store.');
      });

      const settingsObjectStore = db.createObjectStore('settings');

      settingsObjectStore.transaction.addEventListener('complete', (event) => {
        this.populateDefaultSettings();
      });

      settingsObjectStore.transaction.addEventListener('error', (event) => {
        console.error('Error creating object store.');
      });

      // Note that the transaction property of both object stores points at the same transaction
      // so the pair of complete listeners or error listeners will fire at the same time
    }
  },

  /**
   * Populate the apps object store with default apps.
   */
  populateDefaultApps: function() {
    console.log('Populating default apps...');

    // XHR can GET file:// URLs but fetch can not
    var request = new XMLHttpRequest();

    request.addEventListener('load', () => {
      if (!request.responseText) {
        console.log('No default apps were found.');
      }
      var apps = JSON.parse(request.responseText);

      // Create an array of promises for the apps to be created
      let appPromises = [];

      for (const id in apps) {
        let appId = id;
        if (appId.startsWith('{chrome}')) {
          appId = 'file://' + appId.replace('{chrome}', __dirname);
        }
        let manifestUrl = apps[id].manifestUrl;
        if (manifestUrl.startsWith('{chrome}')) {
          manifestUrl = 'file://' + manifestUrl.replace('{chrome}', __dirname);
        }
        let documentUrl = apps[id].documentUrl;
        if (documentUrl.startsWith('{chrome}')) {
          documentUrl = 'file://' + documentUrl.replace('{chrome}', __dirname);
        }

        appPromises.push(this.createApp(appId, manifestUrl, documentUrl, apps[id].manifest));
      }

      // Dispatch an event once all the apps have been populated
      Promise.all(appPromises).then(() => {
        window.dispatchEvent(new CustomEvent('_appschanged'));
      }).catch((error) => {
        console.error('Failed to create default apps: ' + error);
      });
    });

    request.addEventListener('error', function(error) {
      console.error('Error requesting default apps ' + error);
    });

    request.open('GET', __dirname + '/../config/defaults/apps.json', true);
    request.send();
  },

  /**
   * Populate the settings object store with default settings.
   */
  populateDefaultSettings: function() {
    console.log('Populating default settings...');

    // XHR can GET file:// URLs but fetch can not
    var request = new XMLHttpRequest();

    request.addEventListener('load', () => {
      if (!request.responseText) {
        console.log('No default settings were found.');
      }
      var settings = JSON.parse(request.responseText);

      // Create an array of promises for the settings to be created
      let settingPromises = [];

      for (const setting in settings) {
        settingPromises.push(this.createSetting(setting, settings[setting]));
      }

      // Dispatch an event once all the settings have been populated
      Promise.all(settingPromises).then(() => {
        window.dispatchEvent(new CustomEvent('_settingchanged'));
      }).catch((error) => {
        console.error('Failed to create default settings: ' + error);
      });
    });

    request.addEventListener('error', function(error) {
      console.error('Error requesting default settings ' + error);
    });

    request.open('GET', __dirname + '/../config/defaults/settings.json', true);
    request.send();
  },

  /**
   * Add an app to the database.
   * 
   * @param {string} id The identifier of the app, as per the Web App Manifest specification.
   * @param {string} manifestUrl The URL from which the manifest was retrieved.
   * @param {string} documentUrl The URL of the page from which the manifest was linked.
   * @param {Object} manifest The raw web app manifest of the app parsed as JSON.
   * @return {Promise} A promise which resolves upon successful save, or rejects with an error.
   */
  createApp: function(id, manifestUrl, documentUrl, manifest) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['apps'], 'readwrite');

      transaction.oncomplete = (event) => {
        console.log('successfully created app with id ' + id);
        resolve(event);
      };

      transaction.onerror = (event) => {
        console.error('Error creating app with id ' + id);
        reject(event);
      };

      const objectStore = transaction.objectStore('apps');

      const request = objectStore.add({
        'manifestUrl': manifestUrl,
        'documentUrl': documentUrl,
        'manifest': manifest
      }, id);
    });
  },

  /**
   * Delete an app from the database.
   * 
   * @param {string} id The ID of the app to delete.
   */
  deleteApp: function(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['apps'], 'readwrite');

      transaction.oncomplete = (event) => {
        resolve(event);
      };

      transaction.onerror = (event) => {
        console.error('Transaction error deleting app with id ' + id);
        reject(event);
      };

      const objectStore = transaction.objectStore('apps');

      const request = objectStore.delete(id);

      request.onsuccess = (event) => {
        console.log('Successfully deleted app with id ' + id);
      };

      request.onerror = (event) => {
        console.error('Error requesting deletion of app object with id ' + id);
        reject(event);
      };
    });
  },

  /**
   * List apps in database.
   * 
   * @returns {Promise<Map>} Promise which resolves to map of app IDs to app records.
   */
  listApps: function() {
    return new Promise((resolve, reject) => {
      const objectStore = this.db.transaction('apps').objectStore('apps');

      let apps = new Map();

      const request = objectStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if(cursor) {
          apps.set(cursor.key, cursor.value);
          cursor.continue();
        } else {
          resolve(apps);
        }
      };

      request.onerror = (event) => {
        console.error('Error requesting cursor on app object store');
        reject();
      }
    });
  },

  /**
   * Create a setting.
   * 
   * @param {string} key The key of the setting to create.
   * @param {string} value The value of the setting to create.
   * @return {Promise} A Promise which resolves on successful creation.
   */
  createSetting: function(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');

      transaction.oncomplete = (event) => {
        console.log('successfully created setting ' + key);
        resolve(event);
      };

      transaction.onerror = (event) => {
        console.error('Error creating setting ' + key);
        reject(event);
      };

      const objectStore = transaction.objectStore('settings');

      objectStore.add(value, key);
    });
  },

  /**
   * Read a setting.
   *
   * @param {string} key The key of the setting to read.
   */
  readSetting: function(key) {
    return new Promise((resolve, reject) => {
      let setting;
      const transaction = this.db.transaction(['settings']);

      transaction.onsuccess = (event) => {
        resolve(setting);
      }

      transaction.onerror = (event) => {
        console.error('Error when getting setting ' + key);
        reject(event);
      };

      const objectStore = transaction.objectStore('settings');

      const request = objectStore.get(key);

      request.onsuccess = (event) => {
        setting = request.result;
      };
    }); 
  },

  /**
   * Update the value of a setting.
   * 
   * @param {string} key The key of the setting to update.
   * @param {any} value The value of the setting to update.
   * @return {Promise<void>} A Promise which resolves upon successful update.
   */
  updateSetting: function(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');

      transaction.oncomplete = (event) => {
        console.log('successfully updated setting ' + key);
        resolve(event);
      };

      transaction.onerror = (event) => {
        console.error('Error updating setting ' + key);
        reject(event);
      };

      const objectStore = transaction.objectStore('settings');

      objectStore.put(value, key);
    });
  },

  /**
   * List settings from the database.
   * 
   * @returns {Promise<Map<string, any>>} Promise which resolves to map of
   *   setting keys to setting values.
   */
  listSettings: function() {
    return new Promise((resolve, reject) => {
      const objectStore = this.db.transaction('settings').objectStore('settings');

      let settings = new Map();

      const request = objectStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if(cursor) {
          settings.set(cursor.key, cursor.value);
          cursor.continue();
        } else {
          resolve(settings);
        }
      };

      request.onerror = (event) => {
        console.error('Error requesting cursor on settings object store');
        reject();
      }
    });
  },
}