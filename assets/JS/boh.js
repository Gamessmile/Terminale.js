var isFullScreen = false;

const commands = ['help', 'clear', 'orario', 'ygo', 'color'];

{ // DRAG
    var addDragFunctionality = (header, container) => {
        let offsetX, offsetY;

        const move = (e) => {
            if (!isFullScreen) {
                container.style.left = `${e.clientX - offsetX}px`;
                container.style.top = `${e.clientY - offsetY}px`;
            }
        }

        header.addEventListener("mousedown", (e) => {
            if (!isFullScreen) {
                offsetX = e.clientX - container.offsetLeft;
                offsetY = e.clientY - container.offsetTop;
                document.addEventListener("mousemove", move);
            }
        });

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", move);
        });
    }
}

{ // Terminale
    document.addEventListener('DOMContentLoaded', () => {

        function init(container, terminalIcon, terminalBody, terminalHeader) {
            const closeButton = container.querySelector('.X');
            closeButton.addEventListener('click', () => {
                container.parentNode.removeChild(container);
                terminalIcon.parentNode.removeChild(terminalIcon);
            });

            const minimizeButton = container.querySelector('._');
            minimizeButton.addEventListener('click', () => {
                container.classList.toggle('hidden');
                terminalIcon.classList.toggle('evidenziato', !container.classList.contains('hidden'));
            });

            const maximizeButton = container.querySelector('.▢');
            maximizeButton.addEventListener('click', () => {
                const iconcina = maximizeButton;
                if (!isFullScreen) {
                    container.classList.add('fullscreen');
                    container.style.top = '21px';
                    container.style.left = '14px';
                    container.style.width = 'calc(100% - 90px)';
                    container.style.height = '100%';
                    isFullScreen = true;
                    iconcina.innerHTML = '⧉';
                } else {
                    container.classList.remove('fullscreen');
                    container.style.top = '260px';
                    container.style.left = '400px';
                    container.style.width = '700px';
                    container.style.height = '400px';
                    isFullScreen = false;
                    iconcina.innerHTML = '▢';
                }
                terminalIcon.classList.add('evidenziato');
            });

            terminalBody.addEventListener('keydown', async function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();

                    const currentCommand = event.target;
                    const commandText = currentCommand.innerText.trim();
                    currentCommand.contentEditable = 'false';

                    const [command, ...params] = commandText.split(' ');
                    const param = params.join(' ');

                    if (commands.includes(command)) {
                        if (typeof window[command] === 'function') {
                            await window[command](param);
                        } else {
                            addOutput(`Function for command "${command}" not found.`);
                        }
                    } else {
                        addOutput(`Command not found: ${command}`);
                    }
                    addNewInputLine();
                }
            });

            terminalIcon.addEventListener('mouseenter', () => {
                if (!terminalIcon.classList.contains('evidenziato')) {
                    terminalIcon.style.opacity = '0.75';
                }
            });

            terminalIcon.addEventListener('mouseleave', () => {
                if (!terminalIcon.classList.contains('evidenziato')) {
                    terminalIcon.style.opacity = '0.5';
                }
            });

            terminalIcon.addEventListener('click', () => {
                toggleTerminalVisibility(container, terminalIcon);
            });

            addDragFunctionality(terminalHeader, container);

            function addOutput(text) {
                const outputRiga = document.createElement('div');
                outputRiga.classList.add('riga');
                const output = document.createElement('div');
                output.classList.add('output');
                output.innerHTML = text.replace(/\n/g, '<br>');
                outputRiga.appendChild(output);
                terminalBody.appendChild(outputRiga);
            }

            function addNewInputLine() {
                const newRiga = document.createElement('div');
                newRiga.classList.add('riga');

                const newCommand = document.createElement('div');
                newCommand.classList.add('command');
                newCommand.setAttribute('contenteditable', 'true');

                newRiga.appendChild(newCommand);
                terminalBody.appendChild(newRiga);

                newCommand.focus();
            }

            window.help = function (param) {
                const descriptions = {
                    help: 'Mostra la lista di comandi o la descrizione di un comando specifico.\nUso: help {X} (dove X è un numero o il nome del comando)',
                    clear: 'Ripulisci il terminale.',
                    orario: 'Mostra l\'orario corrente.',
                    ygo: 'Cerca informazioni su una carta Yu-Gi-Oh.\nUso: ygo {Nome_Carta}',
                    color: 'Viene colorato il terminale in maniera casuale se non inserito nulla.\nPuò anche essere inserito un colore RGB o HEX',
                };

                if (param) {
                    if (!isNaN(param)) {
                        const index = parseInt(param) - 1;
                        if (index >= 0 && index < commands.length) {
                            addOutput(descriptions[commands[index]]);
                        } else {
                            addOutput(`Comando non trovato per l'indice: ${param}`);
                        }
                    } else if (descriptions[param]) {
                        addOutput(descriptions[param]);
                    } else {
                        addOutput(`Comando non trovato: ${param}`);
                    }
                } else {
                    addOutput("Lista di comandi utilizzabili:\n");
                    for (let i = 0; i < commands.length; i++) {
                        if (commands[i] === 'help') {
                            addOutput(`${i + 1}: ${commands[i]} {Numero Comando} oppure {Nome comando}`);
                        } else if (commands[i] === 'ygo') {
                            addOutput(`${i + 1}: ${commands[i]} {Nome_Carta}`);
                        } else if (commands[i] === 'color') {
                            addOutput(`${i + 1}: ${commands[i]} {RED, GREEN, BLUE} oppure {HEX}`);
                        } else {
                            addOutput(`${i + 1}: ${commands[i]}`);
                        }
                    }
                }
            }

            window.clear = function () {
                while (terminalBody.firstChild) {
                    terminalBody.removeChild(terminalBody.firstChild);
                }
            }

            window.orario = function () {
                addOutput(getOrario());
            }

            window.ygo = async function (cardName) {
                if (!cardName) {
                    addOutput("Devi specificare il nome della carta.");
                    return;
                }

                const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`;
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        throw new Error("Errore nel recupero dei dati.");
                    }
                    const data = await response.json();
                    if (!data.data || !data.data.length) {
                        addOutput(`Nessuna carta trovata con il nome: ${cardName}`);
                        return;
                    }

                    const card = data.data[0];
                    const { name, desc, atk, def, level, race, attribute, card_images, card_prices } = card;
                    const cardInfo = `
                        Nome: ${name}\n
                        Descrizione: ${desc}\n
                        ATK/DEF: ${atk}/${def}\n
                        Livello: ${level}\n
                        Tipo: ${race}\n
                        Attributo: ${attribute}\n
                        Prezzo: $${card_prices[0].cardmarket_price}\n
                    `;
                    addOutput(cardInfo);

                    const imgElement = document.createElement('img');
                    imgElement.src = card_images[0].image_url_cropped;
                    imgElement.style.maxWidth = '30%';
                    imgElement.style.maxHeight = '60%';
                    terminalBody.appendChild(imgElement);

                } catch (error) {
                    addOutput(`Errore: ${error.message}`);
                }
            }

            window.color = function (color) {
                const getRandomInt = (max) => Math.floor(Math.random() * max);
            
                let rgbColor;
                
                if (!color) {
                    const r = getRandomInt(256);
                    const g = getRandomInt(256);
                    const b = getRandomInt(256);
                    rgbColor = `rgb(${r}, ${g}, ${b})`;
                } else if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
                    rgbColor = color;
                } else {
                    const [r, g, b] = color.split(' ').map(Number);
                    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                        rgbColor = `rgb(${r}, ${g}, ${b})`;
                    } else {
                        addOutput("Formato del colore non valido. Inserisci un colore RGB {0-255}{0-255}{0-255} oppure un valido HEX code.");
                        return;
                    }
                }
            
                const terminalHeader = document.querySelector('.terminal-header');
                terminalHeader.style.backgroundColor = rgbColor;
            }

        }

        function toggleTerminalVisibility(container, terminalIcon) {
            container.classList.toggle('hidden');
            terminalIcon.classList.toggle('evidenziato', !container.classList.contains('hidden'));
        }

        const cartella = document.querySelector('.cartella');
        cartella.addEventListener('click', (event) => {
            event.stopPropagation();
            cartella.classList.toggle('aperta');
        });

        document.addEventListener('click', (event) => {
            if (!cartella.contains(event.target)) {
                cartella.classList.remove('aperta');
            }
        });

        const terminalIconInCartella = document.querySelector('.terminal-2ic');
        terminalIconInCartella.addEventListener('click', (event) => {
            if (cartella.classList.contains('aperta')) {
                if (document.querySelector('.container')) {
                    const existingTerminal = document.querySelector('.container');
                    existingTerminal.parentNode.removeChild(existingTerminal);
                }
                const newContainer = document.createElement('div');
                newContainer.classList.add('container');
                newContainer.innerHTML = `
                    <div class="terminal-header">
                        <div class="Name_app">Terminale</div>
                        <div class="buttons">
                            <div class="_">_</div>
                            <div class="▢">▢</div>
                            <div class="X">X</div>
                        </div>
                    </div>
                    <div class="terminal-body">
                        <div class="riga">
                            <div class="command" contenteditable="true"></div>
                        </div>
                    </div>`;
                document.body.appendChild(newContainer);
                if (document.querySelector(".terminal-icon")) {
                    const existingTerminalicon = document.querySelector('.terminal-icon');
                    existingTerminalicon.parentNode.removeChild(existingTerminalicon);
                }
                const newTerminalIcon = document.createElement('div');
                newTerminalIcon.classList.add('terminal-icon', 'evidenziato');
                document.querySelector('.rightfooter').appendChild(newTerminalIcon);

                var container = document.querySelector('.container');
                var terminalBody = document.querySelector('.terminal-body');
                var terminalIcon = document.querySelector('.terminal-icon');
                var terminalHeader = document.querySelector(".container>.terminal-header");

                init(container, terminalIcon, terminalBody, terminalHeader);
            }
        });

        const googleIcon = document.querySelector('.google');
        googleIcon.addEventListener('click', (event) => {
            if (cartella.classList.contains('aperta')) {
                window.open('https://www.google.com', '_blank');
            }
        });

        const youtubeIcon = document.querySelector('.youtube');
        youtubeIcon.addEventListener('click', (event) => {
            if (cartella.classList.contains('aperta')) {
                window.open('https://www.youtube.com', '_blank');
            }
        });

    });
}

{ // Orario
    window.getOrario = function () {
        const now = new Date();
        const options = {
            timeZone: 'Europe/Rome',
            hour12: false,
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        const locale = 'it-IT';
        const formattedOrario = now.toLocaleString(locale, options);
        return formattedOrario;
    }

    function updateOrario() {
        const orarioElement = document.querySelector('.orario');
        if (orarioElement) {
            orarioElement.textContent = getOrario();
        }
    }
    updateOrario();
    setInterval(updateOrario, 1000);
}
