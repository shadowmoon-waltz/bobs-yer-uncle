// ==UserScript==
// @name         Plex Download Button
// @namespace    shadowmoon_waltz
// @description  adds download button and alert with curl download command button to plex; based on https://greasyfork.org/en/scripts/374968-plex-download-buttons-without-premium (unspecified license, the setInterval trick and dynamically adding a download link) and https://piplong.run/plxdwnld/ (MIT License, getting download url code)
// @copyright    2021, shadowmoon_waltz
// @license      GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// @version      0.1
// @match        https://app.plex.tv/*
// @grant        none
// ==/UserScript==

// for download link alert, can optionally add --limit-rate <something>(k|m|g) to curl command to limit k/m/gbytes/second

// this would be useful for getting the mpd when streaming, but is not used here: https://stackoverflow.com/questions/629671/how-can-i-intercept-xmlhttprequests-from-a-greasemonkey-script

const plxDwnld_283594572985 = (function() {
  "use strict";

  const self = {};
  const clientIdRegex = new RegExp("server\/([a-f0-9]{40})\/");
  const metadataIdRegex = new RegExp("key=%2Flibrary%2Fmetadata%2F(\\d+)");
  const apiResourceUrl = "https://plex.tv/api/resources?includeHttps=1&X-Plex-Token={token}";
  const apiLibraryUrl = "{baseuri}/library/metadata/{id}?X-Plex-Token={token}";
  const downloadUrl = "{baseuri}{partkey}?download=1&X-Plex-Token={token}";
  const accessTokenXpath = "//Device[@clientIdentifier='{clientid}']/@accessToken";
  const baseUriXpath = "//Device[@clientIdentifier='{clientid}']/Connection[@local='0']/@uri";
  const partKeyXpath = "//Media/Part[1]/@key";
  let accessToken = null;
  let baseUri = null;

  const getXml = function(url, callback) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState == 4 && request.status == 200) {
        callback(request.responseXML);
      }
    };
    request.open("GET", url);
    request.send();
  };

  const getMetadata = function(xml, popup) {
    const clientId = clientIdRegex.exec(window.location.href);

    if (clientId && clientId.length == 2) {
      const accessTokenNode = xml.evaluate(accessTokenXpath.replace('{clientid}', clientId[1]), xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const baseUriNode = xml.evaluate(baseUriXpath.replace('{clientid}', clientId[1]), xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

      if (accessTokenNode.singleNodeValue && baseUriNode.singleNodeValue) {
        accessToken = accessTokenNode.singleNodeValue.textContent;
        baseUri = baseUriNode.singleNodeValue.textContent;
        const metadataId = metadataIdRegex.exec(window.location.href);

        if (metadataId && metadataId.length == 2) {
          if (popup) {
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId[1]).replace('{token}', accessToken), getDownloadUrlB);
          } else {
            getXml(apiLibraryUrl.replace('{baseuri}', baseUri).replace('{id}', metadataId[1]).replace('{token}', accessToken), getDownloadUrlA);
          }
        } else {
          alert("You are currently not viewing a media item.");
        }
      } else {
        alert("Cannot find a valid accessToken.");
      }
    } else {
      alert("You are currently not viewing a media item.");
    }
  };

  const getMetadataA = function(xml) {
    getMetadata(xml, false);
  };

  const getMetadataB = function(xml) {
    getMetadata(xml, true);
  }

  const getDownloadUrl = function(xml, popup) {
    const partKeyNode = xml.evaluate(partKeyXpath, xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    if (partKeyNode.singleNodeValue) {
      if (popup) {
        alert("curl -O -J -L \"" + downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', partKeyNode.singleNodeValue.textContent).replace('{token}', accessToken) + "\"");
      } else {
        window.location.href = downloadUrl.replace('{baseuri}', baseUri).replace('{partkey}', partKeyNode.singleNodeValue.textContent).replace('{token}', accessToken);
      }
    } else {
      alert("You are currently not viewing a media item.");
    }
  };

  const getDownloadUrlA = function(xml) {
    getDownloadUrl(xml, false);
  };

  const getDownloadUrlB = function(xml) {
    getDownloadUrl(xml, true);
  }

  self.init = function(popup) {
    if (typeof localStorage.myPlexAccessToken != "undefined") {
      if (popup) {
        getXml(apiResourceUrl.replace('{token}', localStorage.myPlexAccessToken), getMetadataB);
      } else {
        getXml(apiResourceUrl.replace('{token}', localStorage.myPlexAccessToken), getMetadataA);
      }
    } else {
      alert("You are currently not browsing or logged into a Plex web environment.");
    }
  };

  return self;
})();

function onPlxDwnld_283594572985() {
  "use strict";

  plxDwnld_283594572985.init(false);
}

function onPlxDwnld2_283594572985() {
  "use strict";

  plxDwnld_283594572985.init(true);
}

setInterval(function() {
  "use strict";

  var dlbtn = document.getElementById("play-btn-pdb");
  if (dlbtn === null) {
    var playbtn = document.querySelectorAll("button[data-qa-id='preplay-more']");
    if (playbtn.length > 0) {
      dlbtn = document.createElement("button");
      dlbtn.setAttribute("id", "play-btn-pdb");
      dlbtn.setAttribute("type", "button");
      dlbtn.setAttribute("role", "button");
      dlbtn.setAttribute("title", "Download Video (Original Quality)");
      dlbtn.className = playbtn[0].className;
      dlbtn.innerHTML = "DL";
      dlbtn.addEventListener("click", onPlxDwnld_283594572985);
      playbtn[0].parentNode.insertBefore(dlbtn, playbtn[0]);

      var dlbtn2 = document.createElement("button");
      dlbtn2.setAttribute("id", "play-btn-pdb2");
      dlbtn2.setAttribute("type", "button");
      dlbtn2.setAttribute("role", "button");
      dlbtn2.setAttribute("title", "Get Video Download Link (Original Quality)");
      dlbtn2.className = playbtn[0].className;
      dlbtn2.innerHTML = "DL2";
      dlbtn2.addEventListener("click", onPlxDwnld2_283594572985);
      playbtn[0].parentNode.insertBefore(dlbtn2, playbtn[0]);
    }
  }
}, 500);
