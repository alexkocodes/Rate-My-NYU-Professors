
window.addEventListener("clicked", function(evt) {

  getNames();


  function getNames(){


    var iframe = document.querySelectorAll("iframe")[2];
    if(iframe && iframe.id == "lbFrameContent" ){
      var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
      allTexts = innerDoc.querySelectorAll("td");

      if(allTexts[0] != undefined && allTexts[0].offsetWidth == "697"){
        var myurl = "https://search-production.ratemyprofessors.com/solr/rmp/select/?solrformat=true&rows=2&wt=json&q=";
        for(let i=0; i< allTexts.length; i++){
          if(allTexts[i].firstElementChild.nextElementSibling &&  allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText ){
            var text = allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.wholeText.trim().split(" ");
            if(text.length >= 15){
              var firstName = text[14].replace(/[,;]/g, "").toLowerCase();
              var lastName = text[13].replace(/[,;]/g, "").toLowerCase();
              myurl1 = myurl + firstName + "+" + lastName + "+AND+schoolid_s%3A675";

              // get professor's rating
              chrome.runtime.sendMessage({ url: myurl1, type: "profRating" }, function (response) {

                  var resp = response.JSONresponse;
                  var numFound = resp.response.numFound;
                  //Add professor data if found
                  if (numFound > 0) {
                      var profID = resp.response.docs[0].pk_id;
                      var realFirstName = resp.response.docs[0].teacherfirstname_t;
                      var realLastName = resp.response.docs[0].teacherlastname_t;
                      var profRating = resp.response.docs[0].averageratingscore_rf;
                      if (profRating != undefined) {
                          var profURL = "http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + profID;
                          var link = " <a style='color: green; font-weight: bold' href=\"" + profURL + "\" target=\"_blank\">(" + profRating + ")</a>";

                          var newDiv = document.createElement("div");
                          newDiv.style.display = "inline";
                          newDiv.innerHTML = link;
                          
                          if(newDiv.innerHTML != allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextElementSibling.innerHTML){ //check if the div has already been added to the document
                            //insert the div after the professor's name
                            allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.parentNode.insertBefore(newDiv, allTexts[i].firstElementChild.nextElementSibling.nextElementSibling.nextSibling.nextSibling);
                          }



                        }
                  }

              });

            }
          }
        }
      }
    }
  }


});
