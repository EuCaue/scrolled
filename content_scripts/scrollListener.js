function updateScrollPercentage() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const totalHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const percentage = (scrollTop / totalHeight) * 100;
  return percentage.toFixed(1);
}

window.addEventListener("scroll", function () {
  console.log("scrolling");
  browser.runtime.sendMessage({
    percent: updateScrollPercentage(),
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    isScrollEvent: true,
  });
});

//  FIX: make this work when change tabs
// window.addEventListener("visibilitychange", function () {
//   console.log("changed tab");
//   browser.runtime.sendMessage({
//     percent: updateScrollPercentage(),
//     isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
//   });
// });

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("clicked on icon");
  sendResponse({ percent: updateScrollPercentage() });
});
