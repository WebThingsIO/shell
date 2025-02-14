/**
 * Homescreen View.
 */
const HomescreenView = {

  homepage: '',

  /**
   * Start the home screen view.
   */
  start: function() {
    console.log('Starting home screen view...');
    this.view = document.getElementById('homescreen-view');
    this.webview = document.getElementById('homescreen-webview');
    window.addEventListener('_backbuttonclicked',
      this.handleBackButtonClicked.bind(this));
    window.addEventListener('_homebuttonclicked',
      this.handleHomeButtonClicked.bind(this));
    window.addEventListener('_windowsbuttonclicked', 
      this.handleWindowsButtonClicked.bind(this));
    window.addEventListener('_newwindowrequested',
      this.handleWindowsButtonClicked.bind(this));
    this.homepage = window.settings.get('homepage');
    this.webview.src = this.homepage;
    // Update the homepage of the homescreen view if the homepage setting changes
    window.settings.observe('homepage', this.handleHomepageChange.bind(this));
  },

  /**
   * Handle a change of homepage.
   * 
   * @param {string} url The new homepage URL. 
   */
  handleHomepageChange: function(url) {
    this.homepage = url;
  },

  /**
   * Handle a click on the back button.
   */
  handleBackButtonClicked: function() {
    if(document.body.classList.contains('home')) {
      this.webview.goBack();
    }
  },

  /**
   * Handle a click on the home button.
   */
  handleHomeButtonClicked: function() {
    // If already on the homescreen then navigate to the home page
    if (document.body.classList.contains('home')) {
      this.webview.src = this.homepage;
    // Otherwise just switch to the home screen
    } else {
      document.body.classList.add('home');
    }
  },

  /**
   * Handle a click on the windows button.
   */
  handleWindowsButtonClicked: function() {
   document.body.classList.remove('home');
  }
}