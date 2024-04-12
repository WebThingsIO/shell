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

    const appObjectStore = db.createObjectStore('apps');

    appObjectStore.transaction.oncomplete = (event) => {
      console.log('Successfully created app object store');
    };

    appObjectStore.transaction.onerror = (event) => {
      console.error('Error creating app object store.');
    }
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
      const transaction = this.db.transaction(["apps"], "readwrite");

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

      request.onsuccess = (event) => {
        console.log('Successfully wrote app object with id ' + id);
      };

      request.onerror = (event) => {
        console.error('Error writing app object with id ' + id);
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
  }
}