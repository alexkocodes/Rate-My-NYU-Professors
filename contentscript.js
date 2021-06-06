var previous_page = [];

window.addEventListener("clicked", function(evt) {

  getNames();

});

function getNames(){


  var iframe = document.querySelectorAll("iframe")[2];
  if(iframe && iframe.id == "lbFrameContent" ){
    var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
    allTexts = innerDoc.querySelectorAll("td");

    if(allTexts[0] != previous_page[0]){ // check if this page has been scanned already to avoid adding ratings more than once

      if(allTexts[0] != undefined && allTexts[0].offsetWidth == "697"){
        var myurl = "https://search-production.ratemyprofessors.com/solr/rmp/select/?solrformat=true&rows=2&wt=json&q=";
        for(let i=0; i< allTexts.length; i++){
          if(allTexts[i].firstElementChild.nextElementSibling &&  allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText ){
            var text = allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText.trim().split(" ");
            if(text.length >= 15){
              var firstName = text[text.length-1].replace(/[,;]/g, "").toLowerCase();
              var lastName = text[text.length-2].replace(/[,;]/g, "").toLowerCase();
              myurl1 = myurl + firstName + "+" + lastName;
              getRatings(myurl1, allTexts[i]);

            }
            if(text.length > 15){ // if there are more than 1 professor, add the first professor
              var firstName = text[text.length-3].replace(/[,;]/g, "").toLowerCase();
              var lastName = text[text.length-4].replace(/[,;]/g, "").toLowerCase();
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


function getRatings(myurl1, currentText){

  var schools = ["675", "772", "4119", "5165"]; // nyu, tandon, steinhardt, dentistry school IDs
  // get professor's rating
  chrome.runtime.sendMessage({ url: myurl1, type: "profRating" }, function (response) {

      var resp = response.JSONresponse;
      var numFound = resp.response.numFound;
      //Add professor data if found
      if (numFound > 0) {

          let foundNYU = false;
          for(let i=0; i<numFound; i++){
            if( resp.response.docs[i] != undefined && schools.includes(resp.response.docs[i].schoolid_s)){ // if any NYU school is found

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

                  //insert the div after the professor's name
                  currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.parentNode.insertBefore(newDiv, currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.nextSibling);

                }
              else{  // if the professor is from NYU, but there is no rating
                addNA(currentText);
              }
            }
        }
        if(foundNYU == false){ // if not from NYU
          addNA(currentText);
        }

    }
      else{ // if no ratings found
        addNA(currentText);
      }

  });

}

function addNA(currentText){  // function that adds N/A
  var profURL = "https://www.ratemyprofessors.com/AddTeacher.jsp";
  var link = " <a style='color: green; font-weight: bold' href=\"" + profURL + "\" target=\"_blank\">(N/A)</a>";
  var newDiv = document.createElement("div");
  newDiv.style.display = "inline";
  newDiv.innerHTML = link;
  //insert the div after the professor's name
  currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.parentNode.insertBefore(newDiv, currentText.firstElementChild.nextElementSibling.nextElementSibling.nextSibling.nextSibling);
}
