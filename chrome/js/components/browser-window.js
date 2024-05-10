/**
 * Browser Window.
 * 
 * A web component representing a window with a URL bar.
 */
class BrowserWindow extends HTMLElement {

  DEFAULT_FAVICON_URL = 'images/default-favicon.svg'

  currentFaviconUrl = this.DEFAULT_FAVICON_URL
  
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.attachShadow({ mode: 'open'});
    const template = document.createElement('template');

    template.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }

        :host(.hidden) {
          display: none;
        }

        .browser-toolbar {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 48px;
          background-color: #5d5d5d;
          margin: 0;
          padding: 8px;
          box-sizing: border-box;
        }

        .url-bar {
          flex: 1;
          display: flex;
          flex-direction: row;
          background-color: #3a3a3a;
          height: 32px;
          border-radius: 5px;
        }

        .url-bar.focused {
          background-color: #fff;
        }

        /* CSS-only spinner from https://cssloaders.github.io/ */
        .spinner {
          display: none;
          width: 16px;
          height: 16px;
          margin: 8px;
          border: 2px solid #FFF;
          border-bottom-color: transparent;
          border-radius: 50%;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
          0% {
              transform: rotate(0deg);
          }
          100% {
              transform: rotate(360deg);
          }
        }

        .url-bar.loading .spinner {
          display: inline-block;
        }

        .url-bar.loading.focused .spinner {
          border: 2px solid #333;
          border-bottom-color: #fff;
        }

        .favicon {
          width: 16px;
          height: 16px;
          padding: 8px;
        }

        .url-bar.loading .favicon {
          display: none;
        }

        .url-bar-input {
          flex: 1;
          border: none;
          border-radius: 5px;
          padding: 0 10px 0 0;
          background-color: transparent;
          color: #ccc;
        }

        .url-bar-input:focus {
          color: #000;
          outline: none;
        }

        .go-button, .stop-button, .reload-button {
          width: 32px;
          height: 32px;
          background-color: transparent;
          border: none;
          background-position: center;
          background-repeat: no-repeat;
        }

        .go-button:active, .reload-button:active, .stop-button:active {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 5px;
        }

        .go-button {
          display: none;
          background-image: url('./images/go.svg');
        }

        .url-bar.focused .go-button {
          display: block;
        }

        .url-bar.focused.loading .go-button {
          display: none;
        }

        .stop-button {
          display: none;
          background-image: url('./images/stop.svg');
        }

        .url-bar.loading .stop-button {
          display: block;
        }

        .reload-button {
          display: block;
          background-image: url('./images/reload.svg');
        }

        .url-bar.focused .reload-button, .url-bar.loading .reload-button {
          display: none;
        }

        webview {
          width: 100%;
          flex: 1;
        }
      </style>
      <menu class="browser-toolbar">
        <form class="url-bar">
          <span class="spinner"></span>
          <img src="${this.DEFAULT_FAVICON_URL}" class="favicon" />
          <input type="text" class="url-bar-input">
          <input type="submit" value="" class="go-button">
          <input type="button" value="" class="stop-button">
          <input type="button" value="" class="reload-button">
        </form>
      </menu>
      <webview class="browser-window-webview" src="https://duckduckgo.com/" preload="js/preload.js"></webview>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.webview = this.shadowRoot.querySelector('webview');
    this.urlBar = this.shadowRoot.querySelector('.url-bar');
    this.urlBarInput = this.shadowRoot.querySelector('.url-bar-input');
    this.stopButton = this.shadowRoot.querySelector('.stop-button');
    this.reloadButton = this.shadowRoot.querySelector('.reload-button');
    this.favicon = this.shadowRoot.querySelector('.favicon');
  }

  /**
   * Get the URL of the currently loaded web page.
   * 
   * @returns {String} The URL of the currently loaded web page.
   */
  getUrl() {
    return this.webview.getURL();
  }

  /**
   * Get the URL of the favicon of the currently loaded web page.
   * 
   * @returns {String} The URL of the favicon of the current page (or default).
   */
  getFaviconUrl() {
    return this.currentFaviconUrl;
  }

  /**
   * Get the title of the currently loaded web page.
   * 
   * @returns {String} The title of the currently loaded web page.
   */
  getTitle() {
    return this.webview.getTitle();
  }

  /**
   * Add event listeners when element appended into document.
   */
  connectedCallback() {
    this.webview.addEventListener('will-navigate',
      this.handleLocationChange.bind(this));
    this.webview.addEventListener('did-navigate',
      this.handleLocationChange.bind(this));
    this.webview.addEventListener('did-navigate-in-page',
      this.handleInPageLocationChange.bind(this));
    this.webview.addEventListener('did-start-loading',
      this.handleStartLoading.bind(this));
    this.webview.addEventListener('did-stop-loading',
      this.handleStopLoading.bind(this));
    this.webview.addEventListener('page-favicon-updated',
      this.handleFaviconUpdated.bind(this));
    this.webview.addEventListener('ipc-message',
      this.handleIPCMessage.bind(this));
    this.urlBarInput.addEventListener('focus',
      this.handleUrlBarFocus.bind(this));
    this.urlBarInput.addEventListener('blur',
      this.handleUrlBarBlur.bind(this));
    this.urlBar.addEventListener('submit',
      this.handleUrlBarSubmit.bind(this));
    this.stopButton.addEventListener('click',
      this.handleStopButtonClick.bind(this));
    this.reloadButton.addEventListener('click',
      this.handleReloadButtonClick.bind(this));
    this.favicon.addEventListener('click',
      this.handleFaviconClick.bind(this));
  }

  /**
   * Remove event listeners when element disconnected from DOM.
   */
  disconnectedCallback() {

  }

  /**
   * Navigate the window back to the previous URL.
   */
  goBack() {
    this.webview.goBack();
  }

  /**
   * Handle a navigation to a new page.
   * 
   * @param {Event} event The will-navigate or did-navigate event. 
   */
  handleLocationChange(event) {
    let hostname;
    try {
      hostname = new URL(event.url).hostname;
    } catch (error) {
      hostname = '';
    }
    this.currentUrl = event.url;
    // Reset manifest URL and favicon
    this.currentManifestUrl = null;
    this.favicon.src = this.currentFaviconUrl = this.DEFAULT_FAVICON_URL;
    this.urlBarInput.value = hostname;
    this.urlBarInput.blur();
  }

  /**
   * Handle an in-page navigation.
   * 
   * @param {Event} event event The did-navigate-in-page event.
   */
  handleInPageLocationChange(event) {
    // Can assume hostname won't change
    this.currentUrl = event.url;
    this.urlBarInput.blur();
  }

  /**
   * Handle the URL bar being focused.
   * 
   * Show full URL and select all.
   */
  handleUrlBarFocus() {
    this.urlBar.classList.add('focused');
    this.urlBarInput.value = this.currentUrl;
    this.urlBarInput.select();
  }

  /**
   * Handle the URL bar losing focus.
   * 
   * Show hostname.
   */
  handleUrlBarBlur() {
    this.urlBar.classList.remove('focused');
    let hostname;
    try {
      hostname = new URL(this.currentUrl).hostname;
    } catch (error) {
      hostname = '';
    }
    this.urlBarInput.value = hostname;
  }

  /**
   * Handle the submission of the URL bar.
   * 
   * @param {Event} event The submit event.
   * @returns null.
   */
  handleUrlBarSubmit(event) {
    event.preventDefault();
    let urlInput = this.urlBarInput.value;
    let url;
    // Check for a valid URL
    try {
      url = new URL(urlInput).href;
    } catch {
      try {
        url = new URL('http://' + urlInput).href;
      } catch {
        return;
      }
    }
    // Manually set URL bar (navigation may not succeed or may redirect)
    this.currentUrl = url;
    // Navigate
    this.webview.loadURL(url);
    // Unfocus the URL bar
    this.urlBarInput.blur();
  }

  /**
   * Handle the webview starting loading.
   */
   handleStartLoading() {
    this.urlBar.classList.add('loading');
  }

  /**
   * Handle the webview stopping loading.
   */
  handleStopLoading() {
    this.urlBar.classList.remove('loading');
  }

  /**
   * Handle an update of the page's favicon.
   * 
   * @param {Event} event The page-favicon-updated event. 
   */
  handleFaviconUpdated(event) {
    // Get the last icon in the array
    let iconUrl = event.favicons.slice(-1) || this.DEFAULT_FAVICON_URL;
    this.currentFaviconUrl = iconUrl;
    this.favicon.src = iconUrl;
  }

  /**
   * Handle receiving an IPC message from the embedded webview.
   * 
   * @param {Event} event The IPC message event. 
   */
  handleIPCMessage(event) {
    if (event.channel == 'manifest') {
      console.log('Manifest URL is ' + event.args[0]);
      this.currentManifestUrl = event.args[0];
    }
  }

  /**
   * Handle a click on the stop button.
   */
  handleStopButtonClick() {
    this.webview.stop();
  }

  /**
   * Handle a click on the reload button.
   */
  handleReloadButtonClick() {
    this.webview.reload();
  }

  /**
   * Handle a click on a favicon.
   * 
   * Show a site info menu.
   */
  handleFaviconClick() {
    let manifestUrl = this.currentManifestUrl;
    let documentUrl = this.currentUrl;
    let faviconUrl = this.currentFaviconUrl;
    let title = this.getTitle();
    let hostname;
    try {
      hostname = new URL(documentUrl).hostname;
    } catch(error) {
      hostname = '';
    }

    // If the current page doesn't belong to an app, then show site info
    if (!manifestUrl) {
      const siteInfoMenu = new SiteInfoMenu(title, hostname, faviconUrl, false);
      this.shadowRoot.appendChild(siteInfoMenu);
    } else {
    // Otherwise, fetch the web app manifest and show app info
      this.fetchManifest().then((rawManifest) => {
        const webApp = new WebApp(rawManifest, manifestUrl, documentUrl);
        const name = webApp.getShortestName();
        const appIconUrl = webApp.getBestIconUrl(this.APP_ICON_SIZE);
        const siteInfoMenu = new SiteInfoMenu(
          name || '', hostname, appIconUrl || faviconUrl, true
        );
        this.shadowRoot.appendChild(siteInfoMenu);
        siteInfoMenu.addEventListener('_pinappbuttonclicked', this.pinApp.bind(this));
      }).catch((error) => {
        console.error('Failed to fetch or parse web app manifest: ' + error);
        // Fall back to showing site info.
        const siteInfoMenu = new SiteInfoMenu(title, hostname, faviconUrl, false);
        this.shadowRoot.appendChild(siteInfoMenu);
      });
    }
  }

  /**
   * Fetch web app manifest for current page.
   *
   * Follows "steps for obtaining a manifest" in the W3C Web App Manifest spec
   * https://www.w3.org/TR/appmanifest/#obtaining
   *
   * @return Promise Promise which resolves with parsed web app manifest.
   */
  fetchManifest() {
    let pageUrl = this.currentUrl;
    let manifestUrl = this.currentManifestUrl;
    let credentialsMode = null;
    return new Promise((resolve, reject) => {
      // "Let origin be the Document's origin"
      var origin = new URL(pageUrl).origin;
      // "If origin is an opaque origin, terminate this algorithm."
      if (origin === null) {
        reject('Manifest linked from opaque origin');
      }
      // "If manifest link is null, terminate this algorithm.""
      if (!manifestUrl) {
        reject('No manifest URL');
      }
      // "If manifest link's href attribute's value is the empty string,
      // then abort these steps."
      if (manifestUrl == '') {
        reject('Manifest URL is an empty string');
      }
      // "Let manifest URL be the result of parsing the value of the href attribute,
      // relative to the element's base URL."
      try {
        var resolvedManifestUrl = new URL(manifestUrl, pageUrl).href;
      } catch(e) {
        // "If parsing fails, then abort these steps."
        reject('Parsing manifest URL resolved against page URL failed.');
      }

      // 'If the manifest link's crossOrigin attribute's value is
      // "use-credentials", then set request's credentials mode to "include".
      // Otherwise, set request's credentials mode to "omit"'.
      if (this.manifestCrossOrigin == 'use-credentials') {
        credentialsMode = 'include';
      } else {
        credentialsMode = 'omit';
      }
      // Note: The following code is executed in the browsing context of the page
      this.webview.executeJavaScript(`
          function fetchManifest() {
            return new Promise((resolve, reject) => {
              // "Let request be a new Request."
              // "Set request's URL to manifest URL."
              var request = new Request('${resolvedManifestUrl}');
              // "Set request's credentials mode..."
              request.credentials = '${credentialsMode}';
              // "Set request's mode is "cors"."
              request.mode = 'cors';
              // "Await the result of performing a fetch with request,
              // letting response be the result."
              fetch(request)
                .then(response => response.json())
                .then(json => {
                  resolve(json);
                }).catch(e =>{
                  reject(e);
                });
            });
          }
          fetchManifest();
        `
      ).then(
        (manifest) => {
          resolve(manifest);
        }
      ).catch(
        (reason) => {
          console.error('Error fetching manifest' + reason);
          reject(reason);
        }
      );
    });
  }

  /**
   * Pin the app the current page belongs to.
   */
  pinApp() {
    const documentUrl = this.currentUrl;
    const manifestUrl = this.currentManifestUrl;
    if(!manifestUrl) {
      console.error('User asked to pin app but no manifest URL found.')
      return;
    }

    // Fetch the web manifest and dispatch an event with the 
    // manifest URL, document URL and raw manifest content
    this.fetchManifest().then((rawManifest) => {
      this.dispatchEvent(new CustomEvent('_pinapprequested', {
        detail: {
          manifestUrl: manifestUrl,
          documentUrl: documentUrl,
          manifest: rawManifest
        },
        bubbles: true
      }));
    }).catch((error) => {
      console.error('Failed to fetch or parse web app manifest: ' + error);
    });
  }
}

// Register custom element
customElements.define('browser-window', BrowserWindow);