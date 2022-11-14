var previous_page = [];

window.addEventListener("clicked", function (evt) {

  getNames();

});

function getNames() {


  var iframe = document.querySelectorAll("iframe")[2];

  var cssLink1 = document.createElement("link");
  cssLink1.rel = "stylesheet";
  cssLink1.href = chrome.runtime.getURL('tooltip.css');
  cssLink1.type = "text/css";
  iframe.contentDocument.head.appendChild(cssLink1);
  //console.log('clicked');
  if (iframe && iframe.id == "lbFrameContent") {
    //console.log('-1');
    var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
    allTexts = innerDoc.querySelectorAll(".ps-htmlarea td");
    if (allTexts[0] != previous_page[0]) { // check if this page has been scanned already to avoid adding ratings more than once
      //console.log('0');
      if (allTexts[0] != undefined) {
        //console.log('1');
        var myurl = "https://search-production.ratemyprofessors.com/solr/rmp/select/?solrformat=true&rows=2&wt=json&q=";
        for (let i = 0; i < allTexts.length; i++) {
          if (allTexts[i].firstElementChild.nextElementSibling && allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText) {
            //console.log('2');
            var text = allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText.trim().split(" ");
            if (text.length >= 15) {
              //console.log('3');
              var firstName = text[text.length - 1].replace(/[,;]/g, "").toLowerCase();
              var lastName = text[text.length - 2].replace(/[,;]/g, "").toLowerCase();
              myurl1 = myurl + firstName + "+" + lastName;
              getRatings(myurl1, allTexts[i]);

            }
            if (text.length > 15) { // if there are more than 1 professor, add the first professor
              var firstName = text[text.length - 3].replace(/[,;]/g, "").toLowerCase();
              var lastName = text[text.length - 4].replace(/[,;]/g, "").toLowerCase();
              myurl1 = myurl + firstName + "+" + lastName;
              getRatings(myurl1, allTexts[i]);
            }
          }
        }
      }
    }
    previous_page = allTexts; // save a record of the current page
  }
}


function getRatings(myurl1, currentText) {

  var schools = ["675", "772", "4119", "5165", "5724"]; // nyu, tandon, steinhardt, dentistry school IDs
  // get professor's rating
  chrome.runtime.sendMessage({ url: myurl1, type: "profRating" }, function (response) {

    var resp = response.JSONresponse;
    var numFound = resp.response.numFound;
    //Add professor data if found
    if (numFound > 0) {

      let foundNYU = false;
      for (let i = 0; i < numFound; i++) {
        if (resp.response.docs[i] != undefined && schools.includes(resp.response.docs[i].schoolid_s)) { // if any NYU school is found

          foundNYU = true;
          var profID = resp.response.docs[i].pk_id;
          var realFirstName = resp.response.docs[i].teacherfirstname_t;
          var realLastName = resp.response.docs[i].teacherlastname_t;
          var profRating = resp.response.docs[i].averageratingscore_rf;
          if (profRating != undefined) {
            var profURL = "http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + profID;
            var link = " <a style='color: green; font-weight: bold' href=\"" + profURL + "\" target=\"_blank\">(" + profRating + ")</a>";

            var newDiv = document.createElement("div");
            newDiv.style.display = "inline";
            newDiv.innerHTML = link;
            newDiv.classList.add("tooltip");

            var allprofRatingsURL = "https://www.ratemyprofessors.com/paginate/professors/ratings?tid=" + profID + "&page=0&max=20";


            var className = currentText.firstElementChild.firstElementChild.textContent.replace(/[- ]/g, "");
            if (!/\d/.test(className)) { // check if it found the correct course code in the Special Topics Courses. If it doesn't contain number, then it searches down again.
              var classDescription = currentText.firstElementChild.firstElementChild.nextSibling.textContent.split(" ");
              className = (classDescription[0] + classDescription[2]).replace(/[- ]/g, "");
            }

            AddTooltip(newDiv, allprofRatingsURL, realFirstName, realLastName, className);


            //insert the div after the professor's name
            currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.parentNode.insertBefore(newDiv, currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.nextSibling);

          }
          else {  // if the professor is from NYU, but there is no rating
            addNA(currentText);
          }
        }
      }
      if (foundNYU == false) { // if not from NYU
        addNA(currentText);
      }

    }
    else { // if no ratings found
      addNA(currentText);
    }

  });

}

function addNA(currentText) {  // function that adds N/A
  var profURL = "https://www.ratemyprofessors.com/AddTeacher.jsp";
  var link = " <a style='color: green; font-weight: bold' href=\"" + profURL + "\" target=\"_blank\">(N/A)</a>";
  var newDiv = document.createElement("div");
  newDiv.style.display = "inline";
  newDiv.innerHTML = link;
  //insert the div after the professor's name
  currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.parentNode.insertBefore(newDiv, currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.nextSibling);
}


function AddTooltip(newDiv, myurl1, realFirstName, realLastName, className) {
  chrome.runtime.sendMessage({ url: myurl1, type: "tooltip" }, function (response) {
    var resp = response.JSONresponse;
    //Build content for professor tooltip
    var easyRating = 0;
    var wouldTakeAgain = 0;
    var wouldTakeAgainNACount = 0;
    var foundFirstReview = false;
    var firstReview = "";
    for (var i = 0; i < resp.ratings.length; i++) {
      easyRating += resp.ratings[i].rEasy;
      if (resp.ratings[i].rWouldTakeAgain === "Yes") {
        wouldTakeAgain++;
      } else if (resp.ratings[i].rWouldTakeAgain === "N/A") {
        wouldTakeAgainNACount++;
      }

      if (resp.ratings[i].rClass === className && !foundFirstReview) {
        firstReview = resp.ratings[i].rComments;
        foundFirstReview = true;
      }

    }
    if (!foundFirstReview && resp.ratings[0]) {
      firstReview = "Not found...but check out this most recent review: " + resp.ratings[0].rComments;
    }

    else if (!resp.ratings[0]) {
      firstReview = "N/A";
    }

    easyRating /= resp.ratings.length;
    if (resp.ratings.length >= 8 && wouldTakeAgainNACount < (resp.ratings.length / 2)) {
      wouldTakeAgain = ((wouldTakeAgain / (resp.ratings.length - wouldTakeAgainNACount)) * 100).toFixed(0).toString() + "%";
    } else {
      wouldTakeAgain = "N/A";
    }
    var div = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = "Rate My Professor Details";
    var professorText = document.createElement("p");
    professorText.textContent = "Professor Name: " + realFirstName + " " + realLastName;
    var easyRatingText = document.createElement("p");
    easyRatingText.textContent = "Level of Difficulty" + ": " + easyRating.toFixed(1).toString() + "/5.0";
    var wouldTakeAgainText = document.createElement("p");
    wouldTakeAgainText.textContent = "Would take again: " + wouldTakeAgain;
    var classText = document.createElement("span");
    classText.textContent = "Most recent review for " + className + ": ";
    var commentText = document.createElement("span");
    commentText.textContent = firstReview;
    commentText.classList.add("review");
    div.appendChild(title);
    div.appendChild(professorText);
    div.appendChild(easyRatingText);
    div.appendChild(wouldTakeAgainText);
    div.appendChild(classText);
    div.appendChild(commentText);

    div.classList.add("tooltiptext");
    newDiv.classList.add("tooltip");
    newDiv.appendChild(div);
  });
}
