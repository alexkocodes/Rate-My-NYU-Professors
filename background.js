chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

  fetch(request.url)
    .then(response => response.json())
    .then(data => sendResponse({JSONresponse: data}));
    return true;
  });
