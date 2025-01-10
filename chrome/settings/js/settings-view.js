/**
 * Settings View.
 * 
 * Configure system settings.
 */
const SettingsView = {
  start: function() {
    this.backButton = document.getElementById('settings-back-button');
    this.settingsMenu = document.getElementById('settings-menu');
    this.homescreenSettingsLink = document.getElementById('homescreen-settings-link');
    this.homescreenSettings = document.getElementById('homescreen-settings');
    this.homescreenSettingsForm = document.getElementById('homescreen-settings-form');
    this.homepageUrlInput = document.getElementById('homepage-url-input');
    this.messageArea = document.getElementById('message-area');

    this.homescreenSettingsLink.addEventListener('click',
      this.handleHomescreenSettingsLinkClick.bind(this));
    this.backButton.addEventListener('click',
      this.handleBackButtonClick.bind(this));
    this.homescreenSettingsForm.addEventListener('submit', 
      this.handleHomescreenSettingsFormSubmit.bind(this));

    // Start database and settings manager.
    Database.start().then(async () => {
      window.settings = new Settings(Database);
      await window.settings.start();
      return;
    });
  },

  /**
   * Handle a click on the homescreen settings link.
   * 
   * @param {Event} event The click event.
   */
  handleHomescreenSettingsLinkClick: function(event) {
    event.preventDefault();
    this.settingsMenu.classList.add('hidden');
    this.homescreenSettings.classList.remove('hidden');
    this.backButton.classList.remove('hidden');
    const homepage = window.settings.get('homepage');
    this.homepageUrlInput.value = homepage;
  },


  /**
   * Handle a click on the back button.
   * 
   * @param {Event} event The click event.
   */
  handleBackButtonClick: function(event) {
    if (event) {
      event.preventDefault();
    }
    this.homescreenSettings.classList.add('hidden');
    this.settingsMenu.classList.remove('hidden');
    this.backButton.classList.add('hidden');
  },

  /**
   * Handle submission of the homescreen settings form.
   * 
   * @param {Event} event The submit event. 
   */
  handleHomescreenSettingsFormSubmit: function(event) {
    event.preventDefault();
    const newHomepageUrl = this.homepageUrlInput.value;
    window.settings.set('homepage', newHomepageUrl).then(() => {
      console.log('Successfully set homepage URL');
      this.showMessage('Successfully updated home page URL');
    }).catch((error) => {
      console.error('Error setting homepage URL: ' + error);
      this.showMessage('Error updating home page URL');
    }).finally(() => {
      this.handleBackButtonClick();
    });
  },

  /**
   * Show a message
   * 
   * Shows a message on the screen as a transient UI element (toast).
   * 
   * @param {String} message A message to show. 
   */
  showMessage: function(message) {
    const toast = new MessageToast();
    toast.setAttribute('message', message);
    this.messageArea.appendChild(toast);
  }
}

/**
  * Start on load.
  */
window.addEventListener('load', function settingsView_onLoad() {
  window.removeEventListener('load', settingsView_onLoad);
  SettingsView.start();
});