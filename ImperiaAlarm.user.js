// ==UserScript==
// @name        ImperiaAlarm
// @namespace   https://imperiaonline.org
// @include     https://imperiaonline.org/*
// @icon        https://ihcdn3.ioimg.org/iov6live/gui/favicon.png
// @author      argorar
// @match       *.imperiaonline.org/imperia/game_v6/game/village.php
// @require     https://raw.githubusercontent.com/Nickersoft/push.js/master/bin/push.min.js
// @grant       none
// @updateURL    https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaAlarm.user.js
// @downloadURL  https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaAlarm.user.js
// @version     1.3.5
// ==/UserScript==

(function() {

  "use strict";
  Push.create("Información", {
    body: "Alarma activada correctamente.",
    icon: "https://ihcdn3.ioimg.org/iov6live/gui/favicon.png",
    timeout: 4000,
    onClick: function() {
      window.focus();
      this.close();
    }
  });

  setInterval("location.reload()", 600000);

  function addJQuery(callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js");
    script.addEventListener("load", function() {
      var script = document.createElement("script");
      script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
      document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
  }
  //false: primera vez , true: no es la primera vez
  var estado = false;
  setInterval(
    function checker() {
      let personales = document.getElementsByClassName("ui-icon attack-me")[0];
      let alianza = document.getElementsByClassName("ui-icon attack-alliance")[0];
      if (personales != null || alianza != null ) {
        if (estado === false) {
          document.location.href = "javascript:void(xajax_viewMissions(container.open({saveName:'missions', title:'Mis misiones'}), {tab:'incoming'}))"; //abre las misiones
          let tdElem = document.getElementsByClassName("numeral tooltip-arrow ui-pass"); //lista de ataques
          for (let i = 0; i < tdElem.length; i++) {
            let tdText = tdElem[i].innerText; //número del ejercito
            if (tdText.length > 3) { //ataque mayor a 999 soldados
              estado = true;
              sonido();
              break;
            }
          }
        }
        sonido();
      } else { //No hay ataques
        estado = false; //se reinicia el estado
      }
    }, 5000);

  function sonido() {
    let sound = document.createElement("object");
    sound.setAttribute("width", "5px");
    sound.setAttribute("height", "5px");
    sound.setAttribute("data", "https://freesound.org/data/previews/254/254819_4597795-lq.mp3");
    document.body.appendChild(sound);
  }
})();
