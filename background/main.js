const darkColors = { text: "#f8f8f8", background: "#1e1e1e" };
const lightColors = { background: "#f8f8f8", text: "#1e1e1e" };

function updateBadge(message) {
  //  TODO: setTitle as percentage
  if (message.isDarkMode) {
    browser.browserAction.setBadgeBackgroundColor({
      color: darkColors.background,
    });
    browser.browserAction.setBadgeTextColor({ color: darkColors.text });
  } else {
    browser.browserAction.setBadgeBackgroundColor({
      color: lightColors.background,
    });
    browser.browserAction.setBadgeTextColor({ color: lightColors.text });
  }
  browser.browserAction.setBadgeText({
    text: `${message.percent.split(".")[0]}%`,
  });
}

browser.webNavigation.onCompleted.addListener(function (details) {
  browser.tabs
    .executeScript({
      file: "/content_scripts/scrollListener.js",
    })
    .then();
});

browser.runtime.onMessage.addListener(updateBadge);
