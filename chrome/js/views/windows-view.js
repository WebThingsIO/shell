const { v4: uuidv4 } = require('uuid');

/**
 * Windows View.
 * 
 * Manages app windows.
 */
const WindowsView = {
  TITLE_BAR_APP_ICON_SIZE: 16,
  DEFAULT_APP_ICON_URL: 'images/default-favicon.svg',

  /**
   * Start the windows view.
   */
  start: function() {
    console.log('Starting windows view...');
    this.view = document.getElementById('windows-view');
    this.windowSwitcher = document.getElementById('window-switcher');
    this.windowsElement = document.getElementById('windows');
    this.windowPreviewsElement = document.getElementById('window-previews');
    this.windowPreviewPlaceholder = document.getElementById('window-preview-placeholder');

    window.addEventListener('_backbuttonclicked',
      this.handleBackButtonClicked.bind(this));
    window.addEventListener('_windowsbuttonclicked', 
      this.handleWindowsButtonClicked.bind(this));
    window.addEventListener('_newwindowbuttonclicked', 
      this.handleNewWindowButtonClicked.bind(this));
    window.addEventListener('_newwindowrequested',
      this.handleNewWindowRequested.bind(this));

    this.windowPreviewsElement.addEventListener('click', 
      this.handleWindowPreviewClicked.bind(this));
    this.windowPreviewsElement.addEventListener('_closewindowbuttonclicked', 
      this.handleCloseWindowButtonClicked.bind(this));
    this.windowsElement.addEventListener('_pinapprequested',
      this.handlePinAppRequest.bind(this));
    this.windowsElement.addEventListener('_unpinapprequested',
      this.handleUnpinAppRequest.bind(this));
    this.windowsElement.addEventListener('_locationchanged', 
      this.handleWindowLocationChange.bind(this));

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
      const title = value.element.getTitle();
      const iconUrl = value.element.getFaviconUrl();
      const thumbnail = value.element.getThumbnail();
      const newWindowPreview = this.windowPreviewsElement.appendChild(
        new WindowPreview(key, title, iconUrl, thumbnail));
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
   * Handle a click on the system back button.
   */
  handleBackButtonClicked: function() {
    // If the user is on the homescreen or no windows are open, ignore.
    if(document.body.classList.contains('home') || !this.currentWindowId) {
      return;
    }

    // Otherwise navigate the current window back
    let currentWindow = this.windows.get(this.currentWindowId);
    currentWindow.element.goBack();
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
    this.handleNewWindowRequested();
  },


  /**
   * Handle a request to create a new window.
   * 
   * @param {Event} event The _newwindowrequested event, which may contain a URL at event.detail.url.
   */
  handleNewWindowRequested: function(event) {
    const newWindowId = uuidv4();
    let newWindow;
    if(event && event.detail && event.detail.url) {
      newWindow = this.windowsElement.appendChild(new BrowserWindow(event.detail.url));
    } else {
      newWindow = this.windowsElement.appendChild(new BrowserWindow());
    }
    newWindow.id = newWindowId;
    this.windows.set(newWindowId, {
      element: newWindow
    });
    this.selectWindow(newWindowId);  
    this.hideWindowSwitcher();
    this.show();
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
   * Handle a close window button click from a window preview.
   * 
   * @param {Event} event The _closewindowbuttonclicked event. 
   */
  handleCloseWindowButtonClicked: function(event) {
    this.closeWindow(event.detail.windowId);
  },

  /**
   * Select a window.
   * 
   * @param {String} id The UUID of the window to select.
   */
  selectWindow: function(id) {
    if (this.currentWindowId) {
      this.windows.get(this.currentWindowId).element.classList.add('hidden');
    }
    this.windows.get(id).element.classList.remove('hidden');
    this.currentWindowId = id;
    this.hideWindowSwitcher();
    window.dispatchEvent(new CustomEvent('_windowselected'));
  },

  /**
   * Handle a request to a pin an app.
   * 
   * @param {CustomEvent} event A _pinapprequested event containing manifest, manifestUrl and documentUrl 
   */
  handlePinAppRequest: function(event) {
    const manifestUrl = event.detail.manifestUrl;
    const documentUrl = event.detail.documentUrl;
    const manifest = event.detail.manifest;
    window.webApps.pin(manifestUrl, documentUrl, manifest).then((app) => {
      console.log('Pinned app with scope ' +  app.scope);
      // Pin all browser windows with a current URL within scope of the pinned app
      this.windows.forEach((browserWindow, windowId, windowsMap) => {
        const documentUrl = browserWindow.element.getUrl();
        if(app.isWithinScope(documentUrl)) {
          // Apply manifest to turn browsing context into application context
          browserWindow.element.setAttribute('display-mode', 'standalone');
          browserWindow.element.setAttribute('application-name', app.name || app.short_name || '');
          browserWindow.element.setAttribute('application-icon', app.getBestIconUrl(this.TITLE_BAR_APP_ICON_SIZE));
        }
      });
    }).catch((error) => {
      console.error('Failed to pin app: ' + error);
      switch (error.message) {
        case 'InvalidManfest':
          window.dispatchEvent(new CustomEvent('_error', { detail: { error: 'Invalid app'}}));
          break;
        case 'PinAppFailed':
          window.dispatchEvent(new CustomEvent('_error', { detail: { error: 'Failed to pin app'}}));
          break;
      }
    });
  },

  /**
   * Handle a request to unpin an app.
   * 
   * @param {CustomEvent} event An _unpinapprequested event containing document URL of the requesting page 
   */
  handleUnpinAppRequest: function(event) {
    // Find the app which the provided document URL belongs to
    const app = window.webApps.match(event.detail.documentUrl);

    if(!app) {
      console.error('Found no app matching the provided document URL');
      window.dispatchEvent(new CustomEvent('_error', { detail: { error: 'Failed to unpin app'}}));
    }

    // Delete the app
    window.webApps.unpin(app.id).then(() => {
      // Unpin all browser windows with a current URL within scope of the pinned app
      this.windows.forEach((browserWindow, windowId, windowsMap) => {
        const documentUrl = browserWindow.element.getUrl();
        if(app.isWithinScope(documentUrl)) {
          // Unapply manifest and revert back to browser display mode
          browserWindow.element.setAttribute('display-mode', 'browser');
          browserWindow.element.removeAttribute('application-name');
          browserWindow.element.removeAttribute('application-icon');
          // There may be another overlapping app but the manifest will get applied on the 
          // next navigation
        }
      });
    }).catch((error) => {
      window.dispatchEvent(new CustomEvent('_error', { detail: { error: 'Failed to unpin app'}}));
    });
  },

  /**
   * Handle a location change of a window.
   * 
   * Check whether the URL matches the navigation scope of a pinned app, and set the display mode
   * of the window accordingly.
   * 
   * @param {*} event 
   */
  handleWindowLocationChange: function(event) {
    const url = event.detail.url;
    const app = window.webApps.match(url);
    const windowId = event.target.id;
    const browserWindow = this.windows.get(windowId);
    if (app) {
      // Apply manifest to turn the browsing context into an application context
      browserWindow.element.setAttribute('display-mode', 'standalone');
      browserWindow.element.setAttribute('application-name', app.name || app.short_name || '');
      browserWindow.element.setAttribute('application-icon', app.getBestIconUrl(this.TITLE_BAR_APP_ICON_SIZE));
    } else {
      // Unapply manifest and reset display mode to browser
      browserWindow.element.setAttribute('display-mode', 'browser');
      browserWindow.element.removeAttribute('application-name');
      browserWindow.element.removeAttribute('application-icon');
    }
  },

  /**
   * Close a window. 
   * 
   * @param {String} id The ID of the window to close. 
   */
  closeWindow: function(id) {
    // Destroy the specified window
    let windowToRemove = document.getElementById(id);
    windowToRemove.remove();
    this.windows.delete(id);
    this.windowPreviews.delete(id);
    this.currentWindowId = null;

    // If no more windows then show placeholder
    if (this.windows.size === 0) {
      this.windowPreviewsElement.classList.add('hidden');
      this.windowPreviewPlaceholder.classList.remove('hidden');
    }
  }
}