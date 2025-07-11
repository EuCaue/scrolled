browser.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id) continue;

      try {
        await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
            allFrames: true,
          },
          files: ["../content_scripts/scrollListener.js"],
        });
      } catch (err) {
        console.error(`Failed to execute script in tab ${tab.id}:`, err);
      }
    }
  } catch (err) {
    console.error("Failed to query tabs:", err);
  }
});

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
      // @ts-ignore
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
