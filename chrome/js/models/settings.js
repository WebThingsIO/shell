/**
 * Settings Manager.
 * 
 * Manages local settings.
 */
class Settings {

  /**
   * An in-memory cache of local settings from the database.
   * 
   * @type {Map<string, any>}
   */
  settings = new Map();
  
  /**
   * A collection of observers to notify when particular settings change.
   * 
   * @type {Map<string, Array<string, function>>}
   */
  observers = new Map();

  /**
   * Constructor.
   * 
   * @param {Database} database Database for saving settings.
   */
  constructor(database) {
    this.db = database;
    // Create a broadcast channel for notifying other instances of the
    // settings manager when settings change
    this.broadcastChannel = new BroadcastChannel('settings');
  }

  /**
   * Start the settings manager.
   * 
   * @returns {Promise<void>} A Promise which resolves on successful initialisation.
   */
  async start() {
    console.log('Starting settings manager...');
    // Refresh settings if an event dispatched in this window
    window.addEventListener('_settingchanged', () => {
      this.refreshSettings.bind(this);
      // Notify other windows
      this.broadcastChannel.postMessage('_settingchanged');
    });
    // Refresh settings if an event broadcasted from another window 
    this.broadcastChannel.onmessage = this.handleSettingsBroadcast.bind(this);
    // Load settings from database
    return this.refreshSettings();
  }

  /**
   * Refresh the map of settings in memory.
   */
  async refreshSettings() {
    // Create a copy of the old settings map
    const oldSettings = this.settings;
    // Clear the map of settings
    this.settings.clear();
    // Get an updated settings map
    this.settings = await this.db.listSettings();
    // If any settings have been added or modified, notify observers
    this.settings.forEach((value, key) => {
      if(!oldSettings.has(key) || value != oldSettings.get(key)) {
        // If no observers for this setting, do nothing
        if(!this.observers.has(key)) {
          return;
        }
        let observers = this.observers.get(key);
        // Notify each observer of the new value
        observers.forEach((callback) => {
          callback(value);
        });
      }
    });
    return;
  }

  /**
   * Handle a settings broadcast event.
   * 
   * This is used to be notified when settings have been changed in another 
   * browsing context, e.g. the main chrome frame or the settings webview.
   * 
   * @param {Event} A BroadcastChannel message event.
   */
  handleSettingsBroadcast(event) {
    if (event.data == '_settingchanged') {
      // Reload all settings into memory
      this.refreshSettings();
    }
  }

  /**
   * Get the value of a setting.
   * 
   * @param {string} key The key of the setting to get. 
   * @returns {any} The value of the property.
   */
  get(key) {
    return this.settings.get(key);
  }

  /**
   * Set the value of a setting.
   * 
   * @param {string} key The key of the setting to set. 
   * @param {*} value The value of the setting to set.
   * @returns {Promise} A Promise that resolves on successful write.
   */
  async set(key, value) {
    // Persist the setting in the database
    await this.db.updateSetting(key, value);
    // Notify other instances of settings manager that a setting has been changed
    this.broadcastChannel.postMessage('_settingchanged');
    // Refresh settings for this instance
    return this.refreshSettings();
  }

  /**
   * Observe a setting.
   * 
   * @param {string} key The key of the setting to observe.
   * @param {function} callback A function to call when that setting changes.
   */
  observe(key, callback) {
    // If no list of observers exists for this key then create one
    if(!this.observers.has(key)) {
      this.observers.set(key, []);
    }
    // Get the current list of observers for the given key
    let observers = this.observers.get(key);
    observers.push(callback);
    // Save the updated list of observers.
    this.observers.set(key, observers);
  }
}