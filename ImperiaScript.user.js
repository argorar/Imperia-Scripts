// ==UserScript==
// @name        ImperiaScript
// @description Countdown panel for Imperia Online and auto attack dungeon
// @namespace   https://imperiaonline.org
// @include     https://imperiaonline.org/*
// @icon        https://ihcdn3.ioimg.org/iov6live/gui/favicon.png
// @author      argorar
// @match       *.imperiaonline.org/imperia/game_v6/game/village.php
// @grant       none
// @updateURL    https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaScript.user.js
// @downloadURL  https://github.com/argorar/Imperia-Scripts/raw/master/ImperiaScript.user.js
// @version     1.0.0
// ==/UserScript==
(function () {
    // ==============================================================================
    // WORKER PARA TIMEOUTS INMUNES AL SEGUNDO PLANO
    // ==============================================================================
    const workerCode = `
        const timers = {};
        self.addEventListener('message', function(e) {
            const data = e.data;
            if (data.command === 'setTimeout') {
                timers[data.id] = setTimeout(function() {
                    self.postMessage({ id: data.id });
                    delete timers[data.id];
                }, data.delay);
            } else if (data.command === 'clearTimeout') {
                clearTimeout(timers[data.id]);
                delete timers[data.id];
            }
        });
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const timerWorker = new Worker(URL.createObjectURL(blob));

    let timerIdCounter = 0;
    const activeCallbacks = {};

    timerWorker.addEventListener('message', function (e) {
        const id = e.data.id;
        if (activeCallbacks[id]) {
            try {
                activeCallbacks[id](); // Ejecutamos el callback
            } finally {
                delete activeCallbacks[id];
            }
        }
    });

    // Función que reemplaza a setTimeout de forma segura
    function workerSetTimeout(callback, delay) {
        const id = ++timerIdCounter;
        activeCallbacks[id] = callback;
        timerWorker.postMessage({ command: 'setTimeout', id: id, delay: delay });
        return id;
    }
    // ==============================================================================


    // 1. Funciones Auxiliares
    function crearDiv(valorActual) {
        // Creamos el contenedor del panel
        let div = document.createElement('div');
        div.id = 'imperia-countdown-panel';
        div.style.position = 'fixed';
        div.style.top = '15px';
        div.style.right = '15px';
        div.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
        div.style.color = '#fff';
        div.style.padding = '15px';
        div.style.borderRadius = '8px';
        div.style.zIndex = '999999';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.boxShadow = '0 4px 10px rgba(0,0,0,0.7)';
        div.style.border = '1px solid #4CAF50';
        div.style.cursor = 'grab';
        div.style.userSelect = 'none';

        // Lógica para arrastrar el panel
        div.addEventListener('mousedown', function (e) {
            let offsetX = e.clientX - div.getBoundingClientRect().left;
            let offsetY = e.clientY - div.getBoundingClientRect().top;
            div.style.cursor = 'grabbing';

            function onMouseMove(eMove) {
                div.style.left = (eMove.clientX - offsetX) + 'px';
                div.style.top = (eMove.clientY - offsetY) + 'px';
                div.style.right = 'auto'; // Deshabilitar el right inicial
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                div.style.cursor = 'grab';
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Crear un contenedor para la primera fila (10 minutes)
        let row1 = document.createElement('div');
        row1.style.marginBottom = '10px';

        // Crear la etiqueta "10 minutes"
        let label = document.createElement('span');
        label.textContent = '10 minutes: ';
        label.style.fontWeight = 'bold';
        label.style.marginRight = '8px';
        row1.appendChild(label);

        // Crear un span dentro del div con el valor actual
        let span = document.createElement('span');
        span.className = 'countdown';
        span.setAttribute('now', valorActual);
        span.textContent = '00:00:00';
        row1.appendChild(span);

        div.appendChild(row1);

        // Crear un contenedor para la segunda fila (Checkbox)
        let row2 = document.createElement('div');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'chk-atacar-cuevas';
        checkbox.style.cursor = 'pointer';
        checkbox.style.marginRight = '8px';

        // Evitar que la interacción con el checkbox inicie el arrastre
        checkbox.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });

        let checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = 'chk-atacar-cuevas';
        checkboxLabel.textContent = 'Atacar Cuevas Automáticamente';
        checkboxLabel.style.cursor = 'pointer';
        checkboxLabel.style.fontSize = '14px';

        checkboxLabel.addEventListener('mousedown', function (e) {
            e.stopPropagation();
        });

        row2.appendChild(checkbox);
        row2.appendChild(checkboxLabel);
        div.appendChild(row2);

        // Evento para activar la función
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                console.log("Activando ataque a cuevas automático...");
                atacarCuevas();
                // Opcional: implementar aquí un loop si se requiere que ataque continuamente mientras esté activado
            }
        });

        return div;
    }

    function programarCutShort(valorActual) {
        let tiempoMs = parseInt(valorActual, 10) * 1000;
        console.log(`Programando ejecución para dentro de ${tiempoMs} ms (${valorActual} segundos)...`);

        workerSetTimeout(() => {
            console.log("El tiempo ha transcurrido. Ejecutando xajax_doAllBuildingCutShort...");
            try {
                // eliminar el div creado
                document.getElementById('imperia-countdown-panel').remove();
                workerSetTimeout(() => { reducir10Minutos(); }, 500);
            } catch (e) {
                console.error("Error al ejecutar xajax_doAllBuildingCutShort:", e);
            }
        }, tiempoMs);
    }

    function buscarValorNow() {
        xajax_doAllBuildingCutShort('allBuildings', {});
        console.log("Redución 10 minutos activado");

        workerSetTimeout(() => {
            // Obtenemos los spans con clase countdown y atributo now que estén dentro del div específico
            let spans = document.querySelectorAll('div#cut_short_10_minutes-tooltip span.countdown[now]');
            console.log(spans);
            spans.forEach(span => {

                let valorActual = span.getAttribute('now');
                console.log("Valor actual del countdown:", valorActual);

                // Inyectar UI con el contador
                let div = crearDiv(valorActual);
                document.body.appendChild(div);

                // Iniciar timeout regresivo en segundo plano a través del Worker
                programarCutShort(valorActual);
            });


        }, 500);

        workerSetTimeout(() => {
            // Cerramos la ventana de la lista actual
            container.close({ saveName: '10minutes', cancelCallback: true, flow: true, closedWith: 'click' })
        }, 800);

    }

    function reducir10Minutos() {
        try {
            xajax_viewAllBuildingList(container.open({ saveName: '10minutes', title: 'Todos los edificios en construcción' }));
            console.log("Consultando la lista de edificios...");
        } catch (e) {
            console.error("No se pudo ejecutar xajax_viewAllBuildingList:", e);
        }

        // Esperamos un pequeño delay (500ms) para que cargue la lista antes de buscar
        workerSetTimeout(() => {
            buscarValorNow();
        }, 1500);
    }

    function atacarCuevas() {
        // Abrir la vista de misiones primero
        xajax_viewMissions(container.open({ saveName: 'missions', title: 'Mis misiones' }), { tab: 'outgoing' });

        workerSetTimeout(() => {
            // IMPORTANTE: Reemplaza "TITULO_AQUI" con el título real que estás buscando
            let ataqueEnCurso = document.querySelector('span[title="Cuevas de la Conquista"]');

            if (ataqueEnCurso) {
                console.log("Ya existe un ataque en curso. Se cancela el flujo de ataque.");

                // Buscar el valor 'now' de los segundos restantes de la misión
                let countdownTd = document.querySelector('td.tcenter.timer.countdown[now]');
                let segundosFaltantes = 0;

                if (countdownTd) {
                    segundosFaltantes = parseInt(countdownTd.getAttribute('now'), 10);
                    console.log("Segundos restantes de la misión (valor 'now'):", segundosFaltantes);
                } else {
                    console.log("No se pudo encontrar el timer de la misión en curso.");
                }

                // Buscar el span para ver si está de ida o de regreso
                let spanLugar = document.querySelector('span.prov-pict.holding1');
                if (spanLugar) {
                    let tituloDestino = spanLugar.getAttribute('title');
                    if (tituloDestino === "Capital") {
                        console.log("El ataque está de regreso a la Capital.");
                    } else {
                        console.log(`El ataque está en camino (destino no es la Capital). Sumando 15 minutos al timer...`);
                        segundosFaltantes += 900; // 15 minutos equivalen a 900 segundos
                    }
                } else {
                    console.log("No se encontró el indicador del lugar del ataque.");
                }

                // Volver a programar el ataque si determinamos un valor
                if (segundosFaltantes > 0) {
                    let esperaMs = (segundosFaltantes + 1) * 1000;
                    console.log(`Programando el próximo ataque automáticamente en ${esperaMs} ms (${segundosFaltantes + 1} segundos).`);
                    workerSetTimeout(() => {
                        atacarCuevas();
                    }, esperaMs);
                }

                container.close({ saveName: 'missions', cancelCallback: true, flow: true, closedWith: 'click' });
                return;
            }

            console.log("No hay ataque en curso. Continuando con el flujo normal...");

            workerSetTimeout(() => {
                xajax_viewOperationCenter(container.open({ saveName: 'operation-center', title: 'Centro operativo' }), { 'tab': 'attack', 'subTab': 'loadAttack', 'userId': 5001 });
            }, 500);

            workerSetTimeout(() => {
                // Intentar usar window para escapar del sandbox de Tampermonkey
                if (typeof window.SetFocusTop === 'function') window.SetFocusTop();
                else if (typeof unsafeWindow !== 'undefined' && unsafeWindow.SetFocusTop) unsafeWindow.SetFocusTop();
                else try { SetFocusTop(); } catch (e) { }
            }, 1000);

            workerSetTimeout(() => {
                // Esto resuelve el problema de acceder a funciones desde consola vs script
                if (typeof window.selectAllArmy === 'function') window.selectAllArmy();
                else if (typeof unsafeWindow !== 'undefined' && unsafeWindow.selectAllArmy) unsafeWindow.selectAllArmy();
                else selectAllArmy();
            }, 1500);

            workerSetTimeout(() => {
                if (typeof window.calcArmyCapacity === 'function') window.calcArmyCapacity();
                else if (typeof unsafeWindow !== 'undefined' && unsafeWindow.calcArmyCapacity) unsafeWindow.calcArmyCapacity();
                else calcArmyCapacity();
            }, 2000);

            workerSetTimeout(() => {
                $('#attackType').val('2');
                xajax_doAttack('OperationCenter', xajax.getFormValues('sendAttackForm'));
            }, 2500);

            workerSetTimeout(() => {
                container.close({ saveName: 'missions', cancelCallback: true, flow: true, closedWith: 'click' });
            }, 3000);

        }, 500);
    }

    function iniciar() {
        reducir10Minutos();
    }

    iniciar();

})();
