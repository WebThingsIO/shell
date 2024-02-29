const { v4: uuidv4 } = require('uuid');

/**
 * Window Manager.
 * 
 * Manages app windows.
 */
const Windows = {
  /**
   * Start the window manager.
   */
  start: function() {
    console.log('Starting window manager...');
    this.view = document.getElementById('windows-view');
    this.windowSwitcher = document.getElementById('window-switcher');
    this.windowsElement = document.getElementById('windows');
    this.windowPreviewsElement = document.getElementById('window-previews');
    this.windowPreviewPlaceholder = document.getElementById('window-preview-placeholder');

    window.addEventListener('_windowsbuttonclicked', 
      this.handleWindowsButtonClicked.bind(this));
    window.addEventListener('_newwindowbuttonclicked', 
      this.handleNewWindowButtonClicked.bind(this));

      this.windowPreviewsElement.addEventListener('click', 
        this.handleWindowPreviewClicked.bind(this));

    // The collection of open windows
    this.windows = new Map();

    // The collection of window previews in the window switcher
    this.windowPreviews = new Map();
  },

  /**
   * Show the windows view.
   */
  show: function() {
    this.view.classList.remove('hidden');
  },

  /**
   * Hide the windows view.
   */
  hide: function() {
    this.view.classList.add('hidden');
  },

  /**
   * Show the window switcher and hide windows.
   */
  showWindowSwitcher: function() {
    // Start from fresh each time
    this.windowPreviewsElement.innerHTML = '';
    this.windowPreviews.clear();

    this.windowsElement.classList.add('hidden');
    if (this.windows.size === 0) {
      this.windowPreviewPlaceholder.classList.remove('hidden');
      return;
    }
    this.windowPreviewPlaceholder.classList.add('hidden');
    this.windows.forEach((value, key, map) => {
      const url = new URL(value.element.getURL());
      const hostname = url.hostname;
      const newWindowPreview = this.windowPreviewsElement.appendChild(new WindowPreview(hostname));
      newWindowPreview.dataset.windowId = key;

      // Store the window preview element in a map of window previews
      this.windowPreviews.set(key, {
        element: newWindowPreview
      });
    });
    this.windowPreviewsElement.classList.remove('hidden');
    this.windowSwitcher.classList.remove('hidden');
    // Reset the scroll position of the window previews element
    this.windowPreviewsElement.scrollTo(0, 0);
    // Scroll to the preview of the current window if one is selected
    if(this.currentWindowId) {
      let x = this.windowPreviews.get(this.currentWindowId).element.getBoundingClientRect().x;
      this.windowPreviewsElement.scrollTo(x, 0);
    }
  },

  /**
   * Hide the window switcher and show windows.
   */
  hideWindowSwitcher: function() {
    this.windowSwitcher.classList.add('hidden');
    this.windowsElement.classList.remove('hidden');
  },

  /**
   * Handle a click on the windows button.
   */
  handleWindowsButtonClicked: function() {
    this.show();
    this.showWindowSwitcher();
  },

  /**
   * Handle a click on the new window button.
   */
  handleNewWindowButtonClicked: function() {
    const newWindowId = uuidv4();
    const newWindow = this.windowsElement.appendChild(new BrowserWindow());
    newWindow.id = newWindowId;
    if (this.currentWindowId) {
      this.windows.get(this.currentWindowId).element.classList.add('hidden');
    }
    this.windows.set(newWindowId, {
      element: newWindow
    });
    this.currentWindowId = newWindowId;
    this.hideWindowSwitcher();
  },


  /**
   * Handle a click on the window previews element.
   * 
   * @param {Event} event The click event.
   */
  handleWindowPreviewClicked: function(event) {
    const target = event.target;
    if(target.tagName != 'WINDOW-PREVIEW') {
      return;
    }
    this.selectWindow(target.dataset.windowId);
  },

  /**
   * Select a window.
   * 
   * @param {String} id The UUID of the window to select.
   */
  selectWindow: function(id) {
    this.windows.get(this.currentWindowId).element.classList.add('hidden');
    this.windows.get(id).element.classList.remove('hidden');
    this.currentWindowId = id;
    this.hideWindowSwitcher();
    window.dispatchEvent(new CustomEvent('_windowselected'));
  }
}