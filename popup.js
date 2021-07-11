
document.addEventListener("DOMContentLoaded", function(event) {
document.getElementById("button").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
   target: { tabId: tab.id },
   function: sendClicked,
  });

  chrome.scripting.insertCSS({
   target: { tabId: tab.id, allFrames: true },
   files: ["tooltip.css"],
  });
});
});


function sendClicked(){
  var evt = new CustomEvent("clicked");
  window.dispatchEvent(evt);

}
