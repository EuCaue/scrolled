let ports: Array<browser.runtime.Port> = [];

browser.runtime.onConnect.addListener((port) => {
  console.log(typeof port, port);
  if (port.name === "popup") {
    ports.push(port);
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { popupOpen: true });
        }
      }
    });

    port.onMessage.addListener((msg) => {
      if (msg.type === "popup-closed") {
        browser.tabs.query({}).then((tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              browser.tabs.sendMessage(tab.id, { popupOpen: false });
            }
          }
        });
      }
    });

    port.onDisconnect.addListener(() => {
      ports = ports.filter((p) => p !== port);
      browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            browser.tabs.sendMessage(tab.id, { popupOpen: false });
          }
        }
      });
    });
  }
});
