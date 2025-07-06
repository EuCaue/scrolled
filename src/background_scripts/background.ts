browser.runtime.onMessage.addListener((message) => {
  if (message.type === "settings-update") {
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;

        browser.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    });
  }
});

browser.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs
            .sendMessage(tab.id, { popupOpen: true })
            .catch((error) => {
              if (error.message.includes("Receiving end does not exist")) {
              } else {
                console.error(`Error sending message to tab ${tab.id}:`, error);
              }
            });
        }
      }
    });

    port.onMessage.addListener((msg) => {
      if (msg.type === "popup-closed") {
        browser.tabs.query({}).then((tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              browser.tabs
                .sendMessage(tab.id, { popupOpen: false })
                .catch((error) => {
                  if (error.message.includes("Receiving end does not exist")) {
                  } else {
                    console.error(
                      `Error sending message to tab ${tab.id}:`,
                      error,
                    );
                  }
                });
            }
          }
        });
      }
    });

    port.onDisconnect.addListener(() => {
      browser.tabs.query({}).then((tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            browser.tabs
              .sendMessage(tab.id, { popupOpen: false })
              .catch((error) => {
                if (error.message.includes("Receiving end does not exist")) {
                } else {
                  console.error(
                    `Error sending message to tab ${tab.id}:`,
                    error,
                  );
                }
              });
          }
        }
      });
    });
  }
});
