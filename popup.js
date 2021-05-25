
document.addEventListener("DOMContentLoaded", function(event) {
document.getElementById("button").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
   target: { tabId: tab.id },
   function: sendClicked,
  });
});
});


function sendClicked(){
  var evt = new CustomEvent("clicked");
  window.dispatchEvent(evt);
  console.log("clicked");
}
