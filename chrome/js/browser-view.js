const {ipcRenderer} = require('electron');

const browserViews = new Map();

ipcRenderer.on('browser-view:event', (event, message) => {
  const browserView = browserViews.get(message.id);
  if (browserView) {
    browserView.onEvent(message);
  }
});

ipcRenderer.on('shell:new-window-requested', (event, detail) => {
  window.dispatchEvent(new CustomEvent('_newwindowrequested', {detail}));
});

window.browserViews = {
  create(id, url, element, onEvent) {
    const updateBounds = () => {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 &&
        window.getComputedStyle(element).visibility !== 'hidden';
      ipcRenderer.send('browser-view:bounds', id, {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: visible ? Math.round(rect.width) : 0,
        height: visible ? Math.round(rect.height) : 0
      });
    };
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(element);
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds, true);
    browserViews.set(id, {onEvent, resizeObserver, updateBounds});
    ipcRenderer.send('browser-view:create', id, url);
    updateBounds();
    return true;
  },

  call(id, method, ...args) {
    return ipcRenderer.invoke('browser-view:call', id, method, args);
  },

  destroy(id) {
    const browserView = browserViews.get(id);
    if (!browserView) {
      return;
    }
    browserView.resizeObserver.disconnect();
    window.removeEventListener('resize', browserView.updateBounds);
    window.removeEventListener('scroll', browserView.updateBounds, true);
    browserViews.delete(id);
    ipcRenderer.send('browser-view:destroy', id);
  }
};