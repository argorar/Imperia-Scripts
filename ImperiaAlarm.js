// ==UserScript==
// @name        ImperiaAlarm
// @namespace   https://imperiaonline.org
// @include     https://imperiaonline.org/*
// @icon        https://ihcdn3.ioimg.org/iov6live/gui/favicon.png
// @author      argorar
// @match       *.imperiaonline.org/imperia/game_v6/game/village.php
// @require     https://raw.githubusercontent.com/Nickersoft/push.js/master/bin/push.min.js
// @grant       none
// @updateURL    https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaAlarm.js
// @downloadURL  https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaAlarm.js
// @version     1.3
// ==/UserScript==

(function() {

'use strict';
console.log("Alarma Activada");
Push.create("Información", {
    body: "Alarma activada correctamente.",
    icon: 'https://ihcdn3.ioimg.org/iov6live/gui/favicon.png',
    timeout: 4000,
    onClick: function () {
        window.focus();
        this.close();
    }
});


function addJQuery(callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js");
    script.addEventListener('load', function() {
        var script = document.createElement("script");
        script.textContent = "window.jQ=jQuery.noConflict(true);(" + callback.toString() + ")();";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
}


setInterval(
    function checker(){
        var sound = document.createElement('object');
        sound.setAttribute('width', '5px');
        sound.setAttribute('height', '5px');
        sound.setAttribute('data', 'https://freesound.org/data/previews/254/254819_4597795-lq.mp3');
        if(document.getElementsByClassName('ui-icon attack-me')[0] != null){
            document.location.href="javascript:void(xajax_viewMissions(container.open({saveName:'missions', title:'Mis misiones'}), {tab:'incoming'}))";//abre las misiones
            var tdElem = document.getElementsByClassName('numeral tooltip-arrow ui-pass');//lista de ataques
            var i;
            for (i = 0; i < tdElem.length; i++) {
                var tdText = tdElem[i].innerText;//número del ejercito
                if(tdText.length > 3){//ataque mayor a 999 soldados
                    document.body.appendChild(sound);
                    break;
                }
                else{
                    console.log("El ataque no es de peligro.");
                }
            }
        }
        else{
            console.log("No hay ataques.");
        }
},5000);
})();