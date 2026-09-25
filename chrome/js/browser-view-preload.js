/**
 * Browser view preload.
 *
 * Runs before pages loaded in a WebContentsView to gather information needed
 * by browser chrome.
 */
const ipcRenderer = require('electron').ipcRenderer;

var checkForManifest = function() {
  var manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    ipcRenderer.send(
      'browser-view:manifest',
      manifestLink.href,
      manifestLink.crossOrigin
    );
  }
}

var preload = function() {
  checkForManifest();
};

document.addEventListener('DOMContentLoaded', preload);