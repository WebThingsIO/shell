/**
 * Webview preload script.
 * 
 * This script is injected into a webview and executed before any other scripts in the page.
 */
const ipcRenderer = require('electron').ipcRenderer;

var preload = function() {
  // Inform browser chrome if link to web app manifest detected
  var manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    ipcRenderer.sendToHost('manifest', manifestLink.href);
  }
};

document.addEventListener('DOMContentLoaded', preload);