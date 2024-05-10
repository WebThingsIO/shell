/**
 * Site Information Menu.
 *
 * Displays information about the current website or web app.
 */
class SiteInfoMenu extends HTMLElement {

    /**
     * Constructor.
     *
     * @param {string} name - Name of a web app or title of website.
     * @param {string} hostname - Host name of website or web app.
     * @param {string} iconUrl - URL of app icon or site icon.
     * @param {boolean} isApp - True if web app manifest detected.
     */
    constructor(name, hostname, iconUrl, isApp) {
      super();
  
      this.attachShadow({ mode: 'open' });
      const template = document.createElement('template');
  
      template.innerHTML = `
        <style>
          .scrim {
            background-color: transparent;
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }
  
          .site-info {
            left: 9px;
            top: 60px;
            width: 250px;
            display: block;
            background-color: #e5e5e5;
            border-radius: 5px;
            border: solid 1px #bfbfbf;
            position: fixed;
            padding: 10px;
            margin: 7.5px 0;
            z-index: 2;
          }
  
          .site-info:after {
            content: '';
            position: absolute;
            top: 0;
            left: 14px;
            width: 0;
            height: 0;
            border: 10px solid transparent;
            border-bottom-color: #e5e5e5;
            border-top: 0;
            margin-left: -10px;
            margin-top: -10px;
          }
  
          .site-info h1 {
            text-align: center;
            font-style: italic;
            font-weight: normal;
            font-size: 14px;
            padding: 20px auto;
          }
  
          .site-info .app-icon, .site-info .site-icon {
            display: block;
            width: 64px;
            height: 64px;
            margin: 20px auto 10px auto;
          }
  
          .site-info .app-name, .site-info .site-hostname {
            display: block;
            font-size: 13px;
            width: 200px;
            margin: 0 auto 5px auto;
            text-align: center;
          }

          .site-info .site-hostname {
            margin-bottom: 20px;
          }

          .site-info .app-hostname {
            display: block;
            font-size: 11px;
            width: 200px;
            margin: 0 auto 20px auto;
            text-align: center;
            color: #666;
          }
  
          .site-info .pin-button {
            display: block;
            margin: 10px auto;
            background-color: #5f8dd3;
            border-radius: 5px;
            border: none;
            padding: 10px 40px;
            color: #fff;
            font-size: 14px;
          }
  
          .site-info button:hover {
            background-color: #3e76ca;
          }
        </style>
        <div class="scrim"></div>
        <menu class="site-info">
        </menu>
      `;

      let siteInfo;

      if (isApp) {
        siteInfo = `
            <h1>Pin App</h1>
            <img class="app-icon" src="${iconUrl}" />
            <span class="app-name">${name}</span>
            <span class="app-hostname">from ${hostname}</span>
            <button class="pin-button">Pin</button>
        `;
      } else {
        siteInfo = `
            <img class="site-icon" src="${iconUrl}" />
            <span class="site-hostname">${hostname}</span>
        `;
      }
  
      const templateClone = template.content.cloneNode(true);
      this.shadowRoot.appendChild(templateClone);

      this.siteInfoMenu = this.shadowRoot.querySelector('.site-info');
      this.siteInfoMenu.innerHTML = siteInfo;
  
      this.scrim = this.shadowRoot.querySelector('.scrim');

      this.pinButton = this.shadowRoot.querySelector('.pin-button')
      
    }

     /**
     * Add event listeners when element appended into document.
     */
    connectedCallback() {
      this.scrim.addEventListener('click', this.handleScrimClick.bind(this));
      if(this.pinButton) {
        this.pinButton.addEventListener('click', this.handlePinAppButtonClick.bind(this));
      }
    }

    /**
     * Remove event listeners when element disconnected from DOM.
     */
    disconnectedCallback() {

    }
  
    /**
     * Handle a click on the scrim.
     *
     * @param {Event} event - The click event.
     */
    handleScrimClick(event) {
      // Self-destruct (remove the site info menu from the DOM)
      this.remove();
    }

    /**
     * Handle a click on the pin app button.
     *
     * @param {Event} event - The click event.
     */
    handlePinAppButtonClick(event) {
      // Dispatch an event to tell the browser window the user wants to pin the current app, then self-destruct
      this.dispatchEvent(new CustomEvent('_pinappbuttonclicked'));
      this.remove();
    }
  
  }
  
  // Register custom element
  customElements.define('site-info-menu', SiteInfoMenu);
  