/**
 * App Icon.
 *
 * An app launcher icon.
 */
class AppIcon extends HTMLElement {

  /**
   * Constructor.
   *
   * @param {string} id - App ID to associate with icon.
   * @param {string} src - Path of icon image.
   * @param {string} name - Name of app from web app manifest.
   * @param {string} startUrl - Starting URL of app to load.
   */
  constructor(id, src, name, startUrl) {
    super();
    this.id = id;
    this.startUrl = startUrl;

    this.attachShadow({ mode: 'open' });
    const template = document.createElement('template');

    template.innerHTML = `
      <style>
        .app-icon {
          display: block;
          width: 128px;
          height: 128px;
          color: #fff;
          text-align: center;
          margin-left: 0;
          margin-right: 16px;
          margin-bottom: 16px;
          text-decoration: none;
        }

        .app-icon-img {
          width: 64px;
          height: 64px;
        }

        .app-icon-name {
          display: block;
          margin-top: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          height: 1.3em;
        }
      </style>

      <a id=${id} href="${startUrl}" class="app-icon">
        <img src="${src}" class="app-icon-img" />
        <span class="app-icon-name">${name}</span>
      </span>
    `;

    const templateClone = template.content.cloneNode(true);
    this.shadowRoot.appendChild(templateClone);
  }

}

// Register custom element
customElements.define('app-icon', AppIcon);
