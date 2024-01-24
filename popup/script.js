const percenSpan = window.document.querySelector("#percentage");
const progressCircle = document.getElementById("progress-circle");
const backgroundCircle = document.getElementById("background-circle");
const radius = 20;
const circumference = 2 * Math.PI * radius;
backgroundCircle.style.strokeDasharray = `${circumference}, 1000`;

// update when open the popup
browser.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
  browser.tabs.sendMessage(tabs[0].id, {}).then(function (response) {
    const { percent } = response;
    percenSpan.textContent = `${response.percent.trim()} %`;
    if (isNaN(percent)) {
      percenSpan.textContent = "0.0 %";
    }
    let dasharrayValue = (percent / 100) * circumference; // circumference is the circumference of a circle with radius 40
    progressCircle.style.strokeDasharray = `${dasharrayValue}, 1000`;
  });
});

// listener for scroll event for the popup
browser.runtime.onMessage.addListener(function (response) {
  const { percent, isScrollEvent } = response;

  if (isScrollEvent === true) {
    percenSpan.textContent = `${response.percent.trim()} %`;
    if (isNaN(percent)) {
      percenSpan.textContent = "0.0 %";
    }
    let dasharrayValue = (percent / 101) * circumference;
    progressCircle.style.strokeDasharray = `${dasharrayValue}, 1000`;
  }
});
