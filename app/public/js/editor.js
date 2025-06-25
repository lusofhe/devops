/**
 * Vokabel-Editor für das Erstellen neuer Vokabellisten
 */
class VocabularyEditor {
    constructor() {
        this.editorTable = document.getElementById('vocab-editor');
        this.feedbackContainer = document.getElementById('feedback-container');
        this.listNameInput = document.getElementById('liste-name');

        // Event-Listener einrichten
        document.getElementById('add-row-button').addEventListener('click', () => this.addNewRow());
        document.getElementById('save-list-button').addEventListener('click', () => this.saveVocabularyList());
        document.getElementById('clear-form-button').addEventListener('click', () => this.clearForm());

        // Delegate-Event für die Lösch-Buttons
        this.editorTable.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-row')) {
                this.removeRow(event.target.closest('tr'));
            }
        });

        // Sicherstellen, dass mindestens eine Zeile vorhanden ist
        if (this.editorTable.tBodies[0].rows.length === 0) {
            this.addNewRow();
        }
    }

    /**
     * Fügt eine neue Zeile zum Editor hinzu
     */
    addNewRow() {
        const tbody = this.editorTable.tBodies[0];
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><input type="text" class="deutsch-input" placeholder="Deutschen Begriff eingeben"></td>
            <td><input type="text" class="vietnamesisch-input" placeholder="Vietnamesischen Begriff eingeben"></td>
            <td><button class="remove-row action-button">Entfernen</button></td>
        `;

        tbody.appendChild(newRow);
    }

    /**
     * Entfernt eine Zeile aus dem Editor
     * @param {HTMLElement} row - Die zu entfernende Zeile
     */
    removeRow(row) {
        // Nicht löschen, wenn es die einzige Zeile ist
        if (this.editorTable.tBodies[0].rows.length > 1) {
            row.remove();
        } else {
            this.showFeedback('Es muss mindestens eine Zeile vorhanden sein', 'error');
        }
    }

    /**
     * Liest alle Vokabeln aus dem Editor aus
     * @returns {Array} Array mit Vokabelobjekten
     */
    collectVocabulary() {
        const vocabulary = [];
        const rows = this.editorTable.tBodies[0].rows;

        for (let i = 0; i < rows.length; i++) {
            const deutschInput = rows[i].querySelector('.deutsch-input');
            const vietnamesischInput = rows[i].querySelector('.vietnamesisch-input');

            const deutsch = deutschInput.value.trim();
            const vietnamesisch = vietnamesischInput.value.trim();

            if (deutsch && vietnamesisch) {
                vocabulary.push({
                    DE: deutsch,
                    VN: vietnamesisch
                });
            }
        }

        return vocabulary;
    }

    /**
     * Speichert die Vokabelliste auf dem Server
     */
    async saveVocabularyList() {
        const listName = this.listNameInput.value.trim();
        if (!listName) {
            this.showFeedback('Bitte geben Sie einen Namen für die Liste ein', 'error');
            return;
        }

        const vocabulary = this.collectVocabulary();
        if (vocabulary.length === 0) {
            this.showFeedback('Die Vokabelliste enthält keine gültigen Einträge', 'error');
            return;
        }

        try {
            const response = await fetch('/api/vocabulary/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: listName,
                    vocabulary: vocabulary
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showFeedback(`Vokabelliste "${listName}" wurde erfolgreich gespeichert`, 'success');
                // Optional: Formular leeren nach erfolgreichem Speichern
                this.clearForm();
            } else {
                this.showFeedback(`Fehler: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Vokabelliste:', error);
            this.showFeedback('Fehler beim Speichern der Liste', 'error');
        }
    }

    /**
     * Leert das Formular
     */
    clearForm() {
        this.listNameInput.value = '';
        const tbody = this.editorTable.tBodies[0];
        tbody.innerHTML = '';
        this.addNewRow();
        this.feedbackContainer.innerHTML = '';
    }

    /**
     * Zeigt eine Feedback-Nachricht an
     * @param {string} message - Die anzuzeigende Nachricht
     * @param {string} type - Der Typ der Nachricht ('success' oder 'error')
     */
    showFeedback(message, type) {
        this.feedbackContainer.innerHTML = `
            <div class="feedback-message ${type}">
                ${message}
            </div>
        `;

        // Nachricht nach 5 Sekunden automatisch ausblenden
        setTimeout(() => {
            this.feedbackContainer.innerHTML = '';
        }, 5000);
    }
}

// Editor initialisieren, nachdem das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.vocabularyEditor = new VocabularyEditor();
});
