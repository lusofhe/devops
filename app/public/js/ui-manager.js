/**
 * Verwaltet die Benutzeroberfläche und UI-Interaktionen
 */
class UIManager {
    constructor() {
        // DOM-Elemente
        this.listsContainer = document.getElementById('lists-container');
        this.vocabHeader = document.getElementById('vocab-header');
        this.vocabContainer = document.getElementById('vocab-container');
        this.controlPanel = document.getElementById('control-panel');
        this.generateAllButton = document.getElementById('generate-all-button');
        this.playAllButton = document.getElementById('play-all-button');

        // Aktive Vokabelliste
        this.activeListItem = null;
    }

    /**
     * Zeigt Fehlermeldung an
     * @param {string} message - Fehlermeldung
     * @param {HTMLElement} container - Container für die Fehlermeldung
     */
    displayError(message, container) {
        container.innerHTML = `<p class="error">${message}</p>`;
    }

    /**
     * Zeigt Vokabellisten in der Sidebar an
     * @param {Array} lists - Liste der verfügbaren Vokabellisten
     * @param {Function} onListClick - Callback-Funktion, die beim Klick auf eine Liste aufgerufen wird
     */
    displayVocabularyLists(lists, onListClick) {
        this.listsContainer.innerHTML = '';

        lists.forEach(list => {
            const listElement = document.createElement('div');
            listElement.className = 'list-item';
            listElement.textContent = list.displayName;
            listElement.dataset.filename = list.filename;
            listElement.addEventListener('click', () => onListClick(list.filename));
            this.listsContainer.appendChild(listElement);
        });
    }

    /**
     * Setzt den aktiven Status einer Vokabelliste
     * @param {string} filename - Dateiname der aktiven Vokabelliste
     */
    setActiveList(filename) {
        document.querySelectorAll('.list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.filename === filename) {
                item.classList.add('active');
                this.activeListItem = item;
            }
        });
    }

    /**
     * Aktualisiert die Kopfzeile der Vokabelliste
     * @param {string} title - Titel der Vokabelliste
     */
    updateVocabHeader(title) {
        this.vocabHeader.innerHTML = `<h2>${title}</h2>`;
    }

    /**
     * Zeigt Lade-Zustand für die Vokabelliste an
     */
    showVocabLoading() {
        this.vocabHeader.innerHTML = '<h2>Lade Vokabelliste...</h2>';
        this.vocabContainer.innerHTML = '';
        this.controlPanel.style.display = 'none';
    }

    /**
     * Zeigt Steuerungspanel an oder aus
     * @param {boolean} show - Panel anzeigen (true) oder ausblenden (false)
     */
    showControlPanel(show) {
        this.controlPanel.style.display = show ? 'block' : 'none';
    }

/**
 * Zeigt die Vokabeln in einer Tabelle an
 * @param {Array} vocabulary - Array mit Vokabeln
 * @param {Function} onPlayClick - Callback-Funktion, die beim Klick auf Play aufgerufen wird
 */
displayVocabulary(vocabulary, onPlayClick) {
  if (!vocabulary || vocabulary.length === 0) {
    this.vocabContainer.innerHTML = '<p>Diese Vokabelliste enthält keine Einträge.</p>';
    return;
  }

  let tableHTML = `
    <table class="responsive-table">
      <thead>
        <tr>
          <th>Deutsch</th>
          <th>Vietnamesisch</th>
          <th>Aktionen</th>
        </tr>
      </thead>
      <tbody>
  `;

  vocabulary.forEach((entry, index) => {
    tableHTML += `
      <tr data-index="${index}">
        <td data-label="Deutsch">${entry.DE}</td>
        <td data-label="Vietnamesisch">${entry.VN}</td>
        <td data-label="Aktionen">
          <button class="play-button" onclick="app.playWord('${entry.DE}', 'DE', ${index})">🔊 DE</button>
          <button class="play-button" onclick="app.playWord('${entry.VN}', 'VN', ${index})">🔊 VI</button>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  this.vocabContainer.innerHTML = tableHTML;
}



    /**
     * Setzt den Status des "Generieren"-Buttons
     * @param {boolean} isGenerating - Gibt an, ob gerade generiert wird
     */
    setGenerateButtonState(isGenerating) {
        this.generateAllButton.disabled = isGenerating;
        this.generateAllButton.textContent = isGenerating ?
            'Generiere Audio...' : 'Alle Vokabeln generieren';
    }

    /**
     * Setzt den Status des "Abspielen"-Buttons
     * @param {boolean} enabled - Button aktivieren (true) oder deaktivieren (false)
     * @param {boolean} isPlaying - Gibt an, ob gerade abgespielt wird
     */
    setPlayButtonState(enabled, isPlaying) {
        this.playAllButton.disabled = !enabled;
        this.playAllButton.textContent = isPlaying ?
            'Stopp' : 'Alle nacheinander abspielen';
    }

    /**
     * Hebt eine bestimmte Vokabelzeile hervor
     * @param {number} index - Index der hervorzuhebenden Zeile
     */
    highlightVocabRow(index) {
        document.querySelectorAll('table tr').forEach(row => {
            row.style.backgroundColor = '';
            if (row.dataset.index == index) {
                row.style.backgroundColor = '#e6f7ff';
            }
        });
    }
}

// Export als globale Variable
window.uiManager = new UIManager();
