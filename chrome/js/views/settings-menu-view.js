/**
 * Settings Menu View.
 * 
 * Represents the settings menu which drops down from the system clock.
 */
const SettingsMenuView = {

  SETTINGS_URL: 'file://' + __dirname + '/settings/index.html',

  /**
   * Start the settings menu view.
   */
  start: function() {
    console.log('Starting settings menu view...');
    this.view = document.getElementById('settings-menu');
    this.scrim = document.getElementById('settings-menu-scrim');
    this.settingsButton = document.getElementById('settings-menu-settings-button');
    this.scrim.addEventListener('click', this.handleScrimClick.bind(this));
    this.settingsButton.addEventListener('click', this.handleSettingsButtonClick.bind(this));
  },

  /**
   * Handle a click on the scrim.
   *
   * @param {Event} event The click event.
   */
  handleScrimClick: function(event) {
    this.hide();
  },

  /**
   * Show the settings menu.
   */
  show: function() {
    this.view.classList.remove('hidden');
    this.scrim.classList.remove('hidden');
  },

  /**
   * Hide the settings menu.
   */
  hide: function() {
    this.view.classList.add('hidden');
    this.scrim.classList.add('hidden');
  },


  handleSettingsButtonClick: function(event) {
    window.dispatchEvent(new CustomEvent('_newwindowrequested', { detail: { url: this.SETTINGS_URL}}));
    this.hide();
  }
}