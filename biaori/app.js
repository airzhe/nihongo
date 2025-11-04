// app.js

// Global translation function
let currentTranslations = {};
const _t = (key, replacements = {}) => {
    let text = currentTranslations[key] || key;
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }
    return text;
};

class SingleSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) { console.error(`SingleSelect container not found: #${containerId}`); return; }
        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.textElement = this.trigger.querySelector('.custom-select-text');
        this.optionsData = [];
        this.selectedValue = options.defaultValue || null;
        this.isOpen = false;
        this.app = options.app;
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.init();
    }
    init() { this.bindEvents(); }
    bindEvents() {
        this.trigger.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
        this.trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(); } });
        document.addEventListener('click', e => { if (this.isOpen && !this.container.contains(e.target)) { this.close(); } });
    }
    setOptions(optionsData) {
        this.optionsData = optionsData;
        if (!this.selectedValue && this.optionsData.length > 0) {
            this.selectedValue = this.optionsData[0].value;
        }
        this.renderOptions();
        this.updateTriggerText();
    }
    renderOptions() {
        this.dropdown.innerHTML = '';
        this.optionsData.forEach(option => {
            const isSelected = this.selectedValue === option.value;
            const optionElement = document.createElement('div');
            optionElement.className = `custom-select-option ${isSelected ? 'selected' : ''}`;
            optionElement.dataset.value = option.value;
            optionElement.textContent = option.label;
            optionElement.setAttribute('role', 'option');
            optionElement.setAttribute('aria-selected', isSelected);
            optionElement.addEventListener('click', e => { e.stopPropagation(); this.selectOption(option.value); });
            this.dropdown.appendChild(optionElement);
        });
    }
    selectOption(value) {
        this.selectedValue = value;
        this.updateTriggerText();
        this.renderOptions();
        this.close();
        this.onSelectionChange(this.selectedValue);
    }
    updateTriggerText() {
        const selectedOption = this.optionsData.find(opt => opt.value === this.selectedValue);
        if (selectedOption) { this.textElement.textContent = selectedOption.label; }
    }
    getValue() { return this.selectedValue; }
    toggle() { this.isOpen ? this.close() : this.open(); }
    open() {
        this.app?.closeAllSelects(this);
        this.isOpen = true;
        this.trigger.classList.add('open');
        this.dropdown.classList.add('open');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.container.closest('.controls').classList.add('z-index-elevated');
    }
    close() {
        this.isOpen = false;
        this.trigger.classList.remove('open');
        this.dropdown.classList.remove('open');
        this.trigger.setAttribute('aria-expanded', 'false');
        setTimeout(() => { if (!this.app.selects.some(s => s.isOpen)) { this.container.closest('.controls')?.classList.remove('z-index-elevated'); } }, 100);
    }
}

class MultiSelect {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) { console.error(`MultiSelect container not found: ${containerSelector}`); return; }
        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.textElement = this.trigger.querySelector('.custom-select-text');
        this.selectedValues = new Set(['all']);
        this.optionsData = [];
        this.isOpen = false;
        this.app = options.app;
        this.onSelectionChange = options.onSelectionChange || (() => {});
        this.init();
    }
    init() { this.bindEvents(); }
    bindEvents() {
        this.trigger.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
        this.trigger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggle(); } });
        document.addEventListener('click', e => { if (this.isOpen && !this.container.contains(e.target)) { this.close(); } });
    }
    setOptions(optionsData) { this.optionsData = optionsData; this.renderOptions(); this.updateTriggerText(); }
    renderOptions() {
        this.dropdown.innerHTML = '';
        this.optionsData.forEach(option => {
            const isSelected = this.selectedValues.has(option.value);
            const optionElement = document.createElement('div');
            optionElement.className = `custom-select-option multi-select-option ${isSelected ? 'selected' : ''}`;
            optionElement.dataset.value = option.value;
            optionElement.innerHTML = `<div class="multi-select-checkbox ${isSelected ? 'checked' : ''}"></div><span>${option.label}</span>`;
            optionElement.setAttribute('role', 'option');
            optionElement.setAttribute('aria-selected', isSelected);
            optionElement.addEventListener('click', e => { e.stopPropagation(); this.toggleOption(option.value); });
            this.dropdown.appendChild(optionElement);
        });
    }
    toggleOption(value) {
        const individualOptions = this.optionsData.filter(opt => opt.value !== 'all');
        if (value === 'all') { this.selectedValues.has('all') ? this.selectedValues.clear() : (this.selectedValues.clear(), this.selectedValues.add('all'));
        } else {
            this.selectedValues.delete('all');
            this.selectedValues.has(value) ? this.selectedValues.delete(value) : this.selectedValues.add(value);
            if (individualOptions.length > 0 && this.selectedValues.size === individualOptions.length) { this.selectedValues.clear(); this.selectedValues.add('all'); }
        }
        if (this.selectedValues.size === 0) { this.selectedValues.add('all'); }
        this.renderOptions(); this.updateTriggerText(); this.onSelectionChange(this.getSelectedValues());
    }
    updateTriggerText() {
        const selectedCount = this.selectedValues.size;
        if (this.selectedValues.has('all') || selectedCount === 0) { this.textElement.innerHTML = _t('count_all_lessons');
        } else if (selectedCount === 1) {
            const selectedValue = this.selectedValues.values().next().value;
            const option = this.optionsData.find(opt => opt.value === selectedValue);
            this.textElement.innerHTML = option ? option.label : '';
        } else { this.textElement.innerHTML = `${_t('label_lesson_short')} <span class="selected-count">${selectedCount}</span>`; }
    }
    getSelectedValues() { return Array.from(this.selectedValues); }
    toggle() { this.isOpen ? this.close() : this.open(); }
    open() {
        this.app?.closeAllSelects(this);
        this.isOpen = true; this.trigger.classList.add('open'); this.dropdown.classList.add('open'); this.trigger.setAttribute('aria-expanded', 'true');
        this.container.closest('.controls').classList.add('z-index-elevated');
    }
    close() {
        this.isOpen = false; this.trigger.classList.remove('open'); this.dropdown.classList.remove('open'); this.trigger.setAttribute('aria-expanded', 'false');
        setTimeout(() => { if (!this.app.selects.some(s => s.isOpen)) { this.container.closest('.controls')?.classList.remove('z-index-elevated'); } }, 100);
    }
}

const WrongWordsManager = {
    app: null,
    uiRefreshTimer: null,

    init(appInstance) { this.app = appInstance; this.bindEvents(); },
    
    bindEvents() {
        const { elements } = this.app;
        elements.wrongWordsOpenBtn.addEventListener('click', () => this.openModal());
        elements.wrongWordsCloseBtn.addEventListener('click', () => this.closeModal());
        elements.wrongWordFilter.addEventListener('change', () => this.renderList());
        elements.wrongWordSort.addEventListener('change', () => this.renderList());
        elements.startWrongWordsQuizBtn.addEventListener('click', () => this.startQuiz());
        elements.exportWrongWordsBtn.addEventListener('click', () => this.export());
        
        elements.clearFilteredWrongWordsBtn.addEventListener('click', async () => {
            const filteredWords = this.getFilteredAndSorted();
            if (filteredWords.length === 0) {
                this.app.showMessageBox('no_words_to_delete');
                return;
            }
            const confirmed = await this.app.showConfirmation('confirm_clear_wrong_words', { count: filteredWords.length });
            if (confirmed) {
                const allWords = this.get();
                const wordsToDeleteSet = new Set(filteredWords.map(w => w.word));
                const remainingWords = allWords.filter(w => !wordsToDeleteSet.has(w.word));
                this.save(remainingWords);
                this.renderAll();
            }
        });

        elements.wrongWordsListContainer.addEventListener('click', async e => {
            const actionTarget = e.target.closest('[data-action]');
            if (actionTarget) {
                await this.handleCardInteraction(actionTarget);
            }
        });
    },

    openModal() { this.app.elements.wrongWordsModal.classList.remove('hidden'); this.app.elements.body.style.overflow = 'hidden'; this.populateFilters(); this.renderAll(); },
    
    closeModal() { clearTimeout(this.uiRefreshTimer); this.app.elements.wrongWordsModal.classList.add('hidden'); this.app.elements.body.style.overflow = ''; },
    
    getStorageKey() { return `${this.app.constants.WRONG_WORDS_KEY_PREFIX}${this.app.state.currentJLPTLevel}`; },
    
    get() { return JSON.parse(localStorage.getItem(this.getStorageKey())) || []; },
    
    save(words) { localStorage.setItem(this.getStorageKey(), JSON.stringify(words)); },
    
    addOrUpdate(vocab, mode) {
        let words = this.get();
        const existing = words.find(w => w.word === vocab.w);
        const now = new Date().toISOString();
        if (existing) {
            existing.wrongCount++; existing.lastWrongTimestamp = now; existing.history.push({ timestamp: now, mode });
            if (existing.masteryLevel === 'familiar') existing.masteryLevel = 'learning';
        } else { words.push({ word: vocab.w, vocabObject: vocab, wrongCount: 1, firstWrongTimestamp: now, lastWrongTimestamp: now, masteryLevel: 'new', difficulty: 3, history: [{ timestamp: now, mode }] }); }
        this.save(words);
    },
    
    promoteMastery(vocabObject) {
        let words = this.get();
        const wordIndex = words.findIndex(w => w.word === vocabObject.w);
        if (wordIndex === -1) return;
        const wordToUpdate = words[wordIndex];
        if (wordToUpdate.masteryLevel === 'new') wordToUpdate.masteryLevel = 'learning';
        else if (wordToUpdate.masteryLevel === 'learning') wordToUpdate.masteryLevel = 'familiar';
        else if (wordToUpdate.masteryLevel === 'familiar') words.splice(wordIndex, 1);
        this.save(words);
    },

    async handleCardInteraction(actionTarget) {
        const action = actionTarget.dataset.action;
        const cardElement = actionTarget.closest('[data-word]');
        const wordValue = cardElement?.dataset.word;
        if (!wordValue || !action) return;
        let words = this.get();
        const wordIndex = words.findIndex(w => w.word === wordValue);
        if (wordIndex === -1) return;
        let wordData = words[wordIndex];
        switch (action) {
            case 'delete':
                if (await this.app.showConfirmation('confirm_delete_word', { word: wordValue })) {
                    words.splice(wordIndex, 1);
                    this.save(words);
                    this.renderAll();
                }
                return;
            case 'edit-mastery':
                const masteryLevels = ['new', 'learning', 'familiar'];
                const currentMasteryIndex = masteryLevels.indexOf(wordData.masteryLevel);
                wordData.masteryLevel = masteryLevels[(currentMasteryIndex + 1) % masteryLevels.length];
                break;
            case 'edit-difficulty':
                wordData.difficulty = ((wordData.difficulty || 3) % 5) + 1;
                break;
            default: return;
        }
        this.save(words);
        
        this.updateCardUI(cardElement, wordData);
        this.renderSummary();

        clearTimeout(this.uiRefreshTimer);
        this.uiRefreshTimer = setTimeout(() => {
            const filterValue = this.app.elements.wrongWordFilter.value;
            const shouldDisappear = (filterValue === 'new' && wordData.masteryLevel !== 'new') ||
                (filterValue === 'learning' && wordData.masteryLevel !== 'learning') ||
                (filterValue === 'familiar' && wordData.masteryLevel !== 'familiar') ||
                (filterValue.startsWith('difficulty-') && wordData.difficulty !== parseInt(filterValue.split('-')[1]));

            if (shouldDisappear) {
                cardElement.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                cardElement.style.opacity = '0';
                cardElement.style.transform = 'scale(0.95)';
                cardElement.addEventListener('transitionend', () => cardElement.remove(), { once: true });
            }
        }, 800);
    },
    
    updateCardUI(cardElement, wordData) {
        if (!cardElement || !wordData) return;
        const masteryInfo = {
            new: { text: _t('wrong_word_mastery_new'), classes: 'bg-bg-blue-600/10 text-blue-600 dark:bg-bg-blue-600/20 dark:text-blue-300' },
            learning: { text: _t('wrong_word_mastery_learning'), classes: 'bg-bg-violet-600/10 text-violet-600 dark:bg-bg-violet-600/20 dark:text-purple-300' },
            familiar: { text: _t('wrong_word_mastery_familiar'), classes: 'bg-bg-emerald-600/20 text-emerald-600 dark:bg-bg-emerald-600/30 dark:text-green-300' }
        };
        const difficultyInfo = {
            1: { text: _t('wrong_word_difficulty', {level: 1}), classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }, 2: { text: _t('wrong_word_difficulty', {level: 2}), classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }, 3: { text: _t('wrong_word_difficulty', {level: 3}), classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' }, 4: { text: _t('wrong_word_difficulty', {level: 4}), classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' }, 5: { text: _t('wrong_word_difficulty', {level: 5}), classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
        };
        const baseBadgeClasses = 'wwm-card-badge border-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bg-indigo-500';
        const masteryButton = cardElement.querySelector('[data-field="masteryBadge"]');
        const mInfo = masteryInfo[wordData.masteryLevel];
        if(masteryButton && mInfo) { masteryButton.className = `${baseBadgeClasses} ${mInfo.classes}`; masteryButton.textContent = mInfo.text; }
        const difficultyButton = cardElement.querySelector('[data-field="difficultyBadge"]');
        const dInfo = difficultyInfo[wordData.difficulty];
        if(difficultyButton && dInfo) { difficultyButton.className = `${baseBadgeClasses} ${dInfo.classes}`; difficultyButton.textContent = dInfo.text; }
    },
    
    populateFilters() {
        this.app.elements.wrongWordFilter.innerHTML = `<option value="all">${_t('wrong_words_filter_all')}</option><option value="new">${_t('wrong_words_filter_new')}</option><option value="learning">${_t('wrong_words_filter_learning')}</option><option value="familiar">${_t('wrong_words_filter_familiar')}</option>` + [1,2,3,4,5].map(l => `<option value="difficulty-${l}">${_t('wrong_words_filter_difficulty', { level: l })}</option>`).join('');
        this.app.elements.wrongWordSort.innerHTML = `<option value="recent">${_t('wrong_words_sort_recent')}</option><option value="frequency">${_t('wrong_words_sort_frequency')}</option><option value="difficulty">${_t('wrong_words_sort_difficulty')}</option><option value="alphabetical">${_t('wrong_words_sort_alphabetical')}</option>`;
    },
    
    getFilteredAndSorted() {
        const filter = this.app.elements.wrongWordFilter.value;
        const sort = this.app.elements.wrongWordSort.value;
        let words = this.get();
        words = words.filter(word => {
            if (filter === 'all') return true;
            if (['new', 'learning', 'familiar'].includes(filter)) return word.masteryLevel === filter;
            if (filter.startsWith('difficulty-')) return word.difficulty === parseInt(filter.split('-')[1]);
            return true;
        });
        return words.sort((a, b) => {
            switch (sort) {
                case 'recent': return new Date(b.lastWrongTimestamp) - new Date(a.lastWrongTimestamp);
                case 'frequency': return b.wrongCount - a.wrongCount;
                case 'difficulty': return (b.difficulty || 0) - (a.difficulty || 0);
                case 'alphabetical': return (a.vocabObject.r || a.vocabObject.w).localeCompare(b.vocabObject.r || b.vocabObject.w, this.app.state.currentLanguage);
                default: return 0;
            }
        });
    },
    
    renderAll() { this.renderSummary(); this.renderList(); },
    
    renderSummary() {
        const words = this.get();
        const summaryWords = document.getElementById('wwm-summary-words');
        if(summaryWords) summaryWords.textContent = words.length;
    },
    
    renderList() {
        const listContainer = this.app.elements.wrongWordsListContainer;
        const cardTemplate = this.app.elements.wrongWordCardTemplate;
        const words = this.getFilteredAndSorted();
        listContainer.innerHTML = '';
        if (words.length === 0) {
            listContainer.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 py-16"><svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-gray-200">${_t('no_matching_words')}</h3><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">${_t('change_filter_or_add_words')}</p></div>`;
            return;
        }
        
        const masteryInfo = {
            new: { text: _t('wrong_word_mastery_new'), classes: 'bg-bg-blue-600/10 text-blue-600 dark:bg-bg-blue-600/20 dark:text-blue-300' },
            learning: { text: _t('wrong_word_mastery_learning'), classes: 'bg-bg-violet-600/10 text-violet-600 dark:bg-bg-violet-600/20 dark:text-purple-300' },
            familiar: { text: _t('wrong_word_mastery_familiar'), classes: 'bg-bg-emerald-600/20 text-emerald-600 dark:bg-bg-emerald-600/30 dark:text-green-300' }
        };
        const difficultyInfo = {
            1: { text: _t('wrong_word_difficulty', {level: 1}), classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }, 2: { text: _t('wrong_word_difficulty', {level: 2}), classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' }, 3: { text: _t('wrong_word_difficulty', {level: 3}), classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' }, 4: { text: _t('wrong_word_difficulty', {level: 4}), classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' }, 5: { text: _t('wrong_word_difficulty', {level: 5}), classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' }
        };

        const fragment = document.createDocumentFragment();
        words.forEach(word => {
            const card = cardTemplate.content.cloneNode(true);
            const cardDiv = card.querySelector('[data-word]');
            cardDiv.dataset.word = word.word;
            cardDiv.style.opacity = '1';
            card.querySelector('[data-field="word"]').textContent = word.vocabObject.w;
            card.querySelector('[data-field="reading"]').textContent = word.vocabObject.r;
            card.querySelector('[data-field="meaning"]').textContent = `${_t('wrong_word_meaning_prefix')}${word.vocabObject.c || word.vocabObject.m}`;
            const exampleContainer = card.querySelector('[data-field="exampleContainer"]');
            const exampleText = word.vocabObject.e || word.vocabObject.u;
            if (exampleText) { card.querySelector('[data-field="example"]').textContent = exampleText; exampleContainer.classList.remove('hidden'); }
            
            const masteryButton = card.querySelector('[data-field="masteryBadge"]');
            const mInfo = masteryInfo[word.masteryLevel];
            if(mInfo) { masteryButton.className += ` ${mInfo.classes}`; masteryButton.textContent = mInfo.text; }
            masteryButton.title = _t('wrong_word_edit_mastery_title');
            
            const difficultyButton = card.querySelector('[data-field="difficultyBadge"]');
            const dInfo = difficultyInfo[word.difficulty];
            if(dInfo) { difficultyButton.className += ` ${dInfo.classes}`; difficultyButton.textContent = dInfo.text; }
            difficultyButton.title = _t('wrong_word_edit_difficulty_title');
            
            card.querySelector('[data-action="delete"]').title = _t('wrong_word_delete');
            card.querySelector('[data-field="wrongCount"]').textContent = _t('wrong_word_count', { count: word.wrongCount });
            card.querySelector('[data-field="lastWrongDate"]').textContent = _t('wrong_word_last_wrong_date', { date: new Date(word.lastWrongTimestamp).toLocaleString(this.app.state.currentLanguage, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) });
            fragment.appendChild(card);
        });
        listContainer.appendChild(fragment);
    },
    
    startQuiz() {
        this.app.state.isPracticingWrongWords = true; 
        const wordsToPractice = this.getFilteredAndSorted(); 
        if (wordsToPractice.length === 0) { 
            this.app.showMessageBox("no_matching_words");
            this.app.state.isPracticingWrongWords = false;
            return; 
        } 
        this.closeModal(); 
        this.app.initializeAndRunQuiz(wordsToPractice.map(item => item.vocabObject), 'mixed'); 
    },
    
    export() {
        const words = this.getFilteredAndSorted();
        if (words.length === 0) { this.app.showMessageBox('no_exportable_wrong_words'); return; }
        const headers = [_t('csv_header_word'), _t('csv_header_kana'), _t('csv_header_meaning'), _t('csv_header_wrong_count'), _t('csv_header_difficulty'), _t('csv_header_mastery'), _t('csv_header_first_wrong_time'), _t('csv_header_last_wrong_time')].join(',');
        const rows = words.map(word => [
            `"${word.word}"`, `"${word.vocabObject.r}"`, `"${(word.vocabObject.c || word.vocabObject.m).replace(/"/g, '""')}"`,
            word.wrongCount, word.difficulty, _t(`wrong_word_mastery_${word.masteryLevel}`),
            `"${new Date(word.firstWrongTimestamp).toLocaleString(this.app.state.currentLanguage)}"`,
            `"${new Date(word.lastWrongTimestamp).toLocaleString(this.app.state.currentLanguage)}"`
        ].join(','));
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join('\n');
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `wrong_words_${this.app.state.currentJLPTLevel}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
};

const VocabularyApp = {
    state: {
        allVocabulary: {}, currentQuiz: [], currentQuestion: 0, score: 0, streak: 0, maxStreak: 0,
        selectedAnswer: null, startTime: null, questionStartTime: null, wrongAnswers: [], answerLog: [],
        maxQuestionReachedInSession: 0, isInputLocked: false, currentJLPTLevel: 'N2',
        touchstartX: 0, touchstartY: 0, touchendX: 0, touchendY: 0, touchstartTime: 0,
        timerInterval: null, nextQuestionTimeoutId: null, sessionHintShown: false,
        currentLanguage: 'ja', availableLanguages: ['ja', 'en', 'zh'],
        isPracticingWrongWords: false,
    },
    constants: {
        WRONG_WORDS_KEY_PREFIX: 'wrongWordsNotebook_',
        SWIPE_THRESHOLD: 50,
        SWIPE_TIME_THRESHOLD: 400,
        NEXT_QUESTION_DELAY_CORRECT: 150,
        NEXT_QUESTION_DELAY_INCORRECT: 1800,
    },
    elements: {}, i18n: {}, selects: [],
    lessonMultiSelect: null, modeSelect: null, difficultySelect: null,
    
    closeAllSelects(exceptThisOne = null) { this.selects.forEach(select => { if (select && select !== exceptThisOne && select.isOpen) { select.close(); } }); },
    
    init() {
        this.cacheDOMElements(); this.initializeTheme();
        this.lessonMultiSelect = new MultiSelect('.multi-select-container', { app: this });
        this.modeSelect = new SingleSelect('mode', { defaultValue: 'reading', app: this });
        this.difficultySelect = new SingleSelect('difficulty', { defaultValue: 'all', app: this });
        this.selects.push(this.lessonMultiSelect, this.modeSelect, this.difficultySelect);
        this.bindEvents(); this.determineLanguage();
        this.loadTranslations().then(() => {
            this.applyTranslations(); this.renderWelcomeMessage();
            this.elements.startQuizButton.disabled = false;
            this.elements.startQuizButton.textContent = _t('btn_start_practice');
            this.initializeAppBasedOnURL(); WrongWordsManager.init(this);
        }).catch(error => { console.error("Failed to load translations:", error); this.elements.startQuizButton.textContent = _t('load_failed'); this.showMessageBox('load_failed'); });
    },
    
    cacheDOMElements() {
        this.elements = {
            body: document.body, mainTitle: document.getElementById('mainTitle'), themeToggleBtn: document.getElementById('themeToggleBtn'),
            header: document.querySelector('.header'), controls: document.querySelector('.controls'), quizContainer: document.getElementById('quizContainer'),
            startQuizButton: document.getElementById('startQuizButton'), keyboardHint: document.getElementById('keyboardHint'),
            messageBox: document.getElementById('messageBox'), messageBoxText: document.getElementById('messageBoxText'), messageBoxButtons: document.getElementById('messageBoxButtons'),
            wrongWordsModal: document.getElementById('wrongWordsModal'), wrongWordsOpenBtn: document.getElementById('wrongWordsOpenBtn'), wrongWordsCloseBtn: document.getElementById('wrongWordsCloseBtn'),
            wrongWordsListContainer: document.getElementById('wrongWordsList'),
            wrongWordFilter: document.getElementById('wrongWordFilter'), wrongWordSort: document.getElementById('wrongWordSort'),
            startWrongWordsQuizBtn: document.getElementById('startWrongWordsQuizBtn'), exportWrongWordsBtn: document.getElementById('exportWrongWordsBtn'),
            clearFilteredWrongWordsBtn: document.getElementById('clearFilteredWrongWordsBtn'),
            wrongWordCardTemplate: document.getElementById('wrongWordCardTemplate')
        };
    },

    bindEvents() {
        this.elements.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        this.elements.startQuizButton.addEventListener('click', () => this.startQuiz());
        document.addEventListener('keydown', e => this.handleKeyDown(e));
        this.elements.quizContainer.addEventListener('touchstart', e => this.handleTouchStart(e), { passive: true });
        this.elements.quizContainer.addEventListener('touchmove', e => this.handleTouchMove(e), { passive: false });
        this.elements.quizContainer.addEventListener('touchend', e => this.handleTouchEnd(e), { passive: true });
        document.addEventListener('click', () => this.closeAllSelects());

        // --- MODIFIED: Event delegation for quiz interactions ---
        this.elements.quizContainer.addEventListener('click', async (e) => { 
            // Only handle events when quiz is active
            if (!this.elements.body.classList.contains('quiz-mode-active')) return;

            // 1. Handle exit button
            if (e.target.closest('.exit-btn')) {
                // If user hasn't started answering questions, exit directly without confirmation
                if (this.state.currentQuestion === 0 && this.state.score === 0) {
                    this.resetQuiz();
                } else {
                    const confirmed = await this.showConfirmation('confirm_exit_quiz'); 
                    if (confirmed) {
                        this.resetQuiz();
                    }
                }
                return;
            }

            // 2. Handle answer option clicks
            const optionBtn = e.target.closest('.option');
            if (optionBtn && !this.state.isInputLocked) {
                // 获取当前问题的数据,以便检查其模式
                const currentQuestionData = this.state.currentQuiz[this.state.currentQuestion];
                const wordToPlay = optionBtn.dataset.word;

                // 只有在当前问题是 "reading" 模式时,才播放音频
                if (wordToPlay) {
                    this.playWordAudio(wordToPlay);
                }
                
                this.submitAnswer(parseInt(optionBtn.dataset.index, 10));
                return;
            }

            // 3. Handle clicking question to show example
            const questionData = this.state.currentQuiz[this.state.currentQuestion];
            if (e.target.closest('#questionText') && questionData?.vocab?.e) {
                const sentenceDisplay = this.elements.quizContainer.querySelector('#exampleSentenceDisplay');
                if (sentenceDisplay) {
                    sentenceDisplay.textContent = _t('example_sentence_wrapper', { example: questionData.vocab.e });
                    sentenceDisplay.classList.toggle('visible');
                }
                return;
            }

            // 4. Handle playing audio from detailed info panel
            const detailedItem = e.target.closest('.detailed-info-item[data-w]');
            if (detailedItem) {
                this.playWordAudio(detailedItem.dataset.w);
                return;
            }
            
            // 5. Handle detailed info panel UI
            const detailedInfoPanel = this.elements.quizContainer.querySelector('#detailedInfoPanel');
            if (e.target.closest('#swipeUpIndicator')) {
                detailedInfoPanel?.classList.toggle('visible');
                return;
            }
            if (e.target.closest('#panelHandle')) {
                detailedInfoPanel?.classList.remove('visible');
                return;
            }
        });
    },

    // --- NEW: Helper function to play word audio ---
    playWordAudio(word) {
        // 1. 定义一个当前支持音频的级别列表
        const supportedLevels = ['n2']; // 将来支持了 N1，就改成 ['n1', 'n2']
        // 2. 获取当前级别
        const currentLevel = this.state.currentJLPTLevel.toLowerCase();
        // 3. 检查当前级别是否在支持列表中
        if (!supportedLevels.includes(currentLevel)) {
            // 如果不支持，直接返回，什么也不做
            console.log(`Audio playback is not yet supported for level: ${currentLevel}`);
            return; 
        }
        let audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            audioPlayer = document.createElement('audio');
            audioPlayer.id = 'audioPlayer';
            audioPlayer.style.display = 'none';
            document.body.appendChild(audioPlayer);
        }
        const audioPath = `data/audio/${currentLevel}/${word}.mp3`;
        audioPlayer.src = audioPath;
        audioPlayer.play().catch(error => {
            console.warn(`Could not play audio for "${word}". File might be missing.`, error);
            // Optionally, show a small visual feedback to the user that audio failed
        });
    },

    determineLanguage() {
        const langParam = new URLSearchParams(window.location.search).get('lang');
        if (langParam && this.state.availableLanguages.includes(langParam)) { this.state.currentLanguage = langParam; } 
        else { const browserLang = (navigator.language || navigator.languages[0]).split('-')[0]; if (this.state.availableLanguages.includes(browserLang)) { this.state.currentLanguage = browserLang; } }
        document.documentElement.lang = this.state.currentLanguage;
    },

    async loadTranslations() {
        if (this.i18n[this.state.currentLanguage]) {
            currentTranslations = this.i18n[this.state.currentLanguage];
            return;
        }
        try {
            const response = await fetch(`./locales/${this.state.currentLanguage}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const translations = await response.json();
            this.i18n[this.state.currentLanguage] = translations;
            currentTranslations = translations;
        } catch (error) {
            console.error("Error loading translations:", error);
            if (this.state.currentLanguage !== 'en') {
                this.state.currentLanguage = 'en';
                document.documentElement.lang = 'en';
                return this.loadTranslations();
            } else {
                currentTranslations = {}; 
                this.showMessageBox('load_failed_final'); 
            }
        }
    },

    applyTranslations() { 
        document.querySelectorAll('[data-i18n]').forEach(element => { 
            const key = element.getAttribute('data-i18n'); 
            const translation = _t(key); 
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') { 
                element.placeholder = translation; 
            } else { 
                element.innerHTML = translation; 
            } 
        }); 
        document.title = _t('page_title'); 
        this.modeSelect.setOptions([ { value: 'reading', label: _t('mode_reading') }, { value: 'meaning', label: _t('mode_meaning') }, { value: 'usage', label: _t('mode_usage') }, { value: 'mixed', label: _t('mode_mixed') } ]); 
        this.difficultySelect.setOptions([ { value: '5', label: _t('count_5') }, { value: '10', label: _t('count_10') }, { value: '20', label: _t('count_20') }, { value: '30', label: _t('count_30') }, { value: 'all', label: _t('count_all') } ]); 
    },
    
    submitAnswer(selectedIndex) {
        if (this.state.isInputLocked) return;
        this.state.isInputLocked = true;
        clearInterval(this.state.timerInterval);
        const question = this.state.currentQuiz[this.state.currentQuestion];
        const isCorrect = question.options[selectedIndex].correct;
        const timeSpent = Math.floor((Date.now() - this.state.questionStartTime) / 1000);
        this.state.answerLog.push({ questionIndex: this.state.currentQuestion, selectedOptionIndex: selectedIndex, isCorrect, timeSpent });
        
        if (isCorrect) {
            this.state.score++; this.state.streak++;
            if (this.state.streak > this.state.maxStreak) this.state.maxStreak = this.state.streak;
            if (this.state.isPracticingWrongWords) WrongWordsManager.promoteMastery(question.vocab);
        } else {
            this.state.streak = 0;
            this.state.wrongAnswers.push({ question: question.question, yourAnswer: question.options[selectedIndex].text, correctAnswer: question.correctAnswer, vocab: question.vocab });
            WrongWordsManager.addOrUpdate(question.vocab, question.mode);
        }

        this.showQuestion({ isReviewMode: false });
        const delay = isCorrect ? this.constants.NEXT_QUESTION_DELAY_CORRECT : this.constants.NEXT_QUESTION_DELAY_INCORRECT;
        this.state.nextQuestionTimeoutId = setTimeout(() => this.nextQuestion(), delay);
    },
    
    hideMessageBox() {
        this.elements.messageBox.classList.add('hidden');
    },

    showModal(messageKey, replacements = {}, buttons = []) {
        return new Promise(resolve => {
            this.elements.messageBoxText.textContent = _t(messageKey, replacements);
            
            if (buttons.length === 0) {
                buttons.push({
                    textKey: 'message_box_ok',
                    classes: 'from-indigo-500 to-purple-600 text-white',
                    value: true
                });
            }
    
            const buttonHtml = buttons.map(btn => 
                `<button class="modal-action-btn glass-control py-2 px-4 interactive-press-effect ${btn.classes}" data-value="${btn.value}">${_t(btn.textKey)}</button>`
            ).join('');
    
            this.elements.messageBoxButtons.innerHTML = buttonHtml;
            this.elements.messageBox.classList.remove('hidden');
    
            const handleClick = (e) => {
                const button = e.target.closest('button[data-value]');
                if (button) {
                    this.hideMessageBox();
                    this.elements.messageBoxButtons.removeEventListener('click', handleClick);
                    resolve(JSON.parse(button.dataset.value));
                }
            };
            this.elements.messageBoxButtons.addEventListener('click', handleClick, { once: true });
            this.elements.messageBoxButtons.querySelector('button')?.focus();
        });
    },

    showMessageBox(messageKey, replacements = {}) {
        this.showModal(messageKey, replacements);
    },

    async showConfirmation(messageKey, replacements = {}) {
        const buttons = [
            { textKey: 'confirm_btn', classes: 'bg-gradient-to-br from-red-500 to-orange-500 text-white', value: true },
            { textKey: 'cancel_btn', classes: 'bg-gray-200 dark:bg-gray-600', value: false }
        ];
        return await this.showModal(messageKey, replacements, buttons);
    },

    async initializeAppBasedOnURL() { 
        const ALLOWED_LEVELS = ['n1', 'n2', 'n3', 'biaori', 'gaoji']; 
        const DEFAULT_LEVEL = 'n2'; 
        const getLevelFromPath = () => { const fullUrl = window.location.href.toLowerCase(); return ALLOWED_LEVELS.find(level => fullUrl.includes(`${level}`)) || null; }; 
       console.log(getLevelFromPath);
        const urlParams = new URLSearchParams(window.location.search); 
        const levelFromParam = urlParams.get('level')?.toLowerCase(); 
        const levelFromPath = getLevelFromPath(); 
        let determinedLevel = DEFAULT_LEVEL; 
        if (levelFromParam && ALLOWED_LEVELS.includes(levelFromParam)) { determinedLevel = levelFromParam; } 
        else if (levelFromPath) { determinedLevel = levelFromPath; } 
        this.state.currentJLPTLevel = determinedLevel.toUpperCase(); 
        console.log(determinedLevel);
        const mainTitleKeyMap = { 'BIAORI': 'BIAORI', 'GAOJI': 'GAOJI', 'N2': 'JLPT_N2', 'N1': 'JLPT_N1', 'N3': 'JLPT_N3' }; 
        this.elements.mainTitle.textContent = _t(mainTitleKeyMap[this.state.currentJLPTLevel] || 'header_title'); 
        await this.loadVocabularyData(`./data/${determinedLevel}.json`); 
    },
    
    async loadVocabularyData(fileName) {
        const cacheKey = `vocab_${this.state.currentJLPTLevel.toLowerCase()}`; const lastModifiedKey = `${cacheKey}_lastModified`;
        this.elements.startQuizButton.disabled = true; this.elements.startQuizButton.textContent = _t('loading_data');
        try {
            const headResponse = await fetch(fileName, { method: 'HEAD' });
            const serverLastModified = headResponse.headers.get('Last-Modified');
            if (serverLastModified && serverLastModified === localStorage.getItem(lastModifiedKey)) {
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) { this.state.allVocabulary = JSON.parse(cachedData); this.populateLessonSelect(); return; }
            }
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            try { localStorage.setItem(cacheKey, JSON.stringify(data)); if (serverLastModified) localStorage.setItem(lastModifiedKey, serverLastModified); } 
            catch (e) { console.warn("Could not cache vocabulary data. Storage might be full.", e); }
            this.state.allVocabulary = data; this.populateLessonSelect();
        } catch (networkError) {
            console.error(`Could not load vocabulary from ${fileName}:`, networkError);
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) { this.state.allVocabulary = JSON.parse(cachedData); this.populateLessonSelect(); } 
            else { this.showMessageBox('data_load_failed_message', { fileName }); this.elements.startQuizButton.textContent = _t('load_failed'); }
        } finally { if (Object.keys(this.state.allVocabulary).length > 0) { this.elements.startQuizButton.disabled = false; this.elements.startQuizButton.textContent = _t('btn_start_practice'); } }
    },
    
    populateLessonSelect() { 
        if (!this.lessonMultiSelect) return; 
        const lessonKeys = Object.keys(this.state.allVocabulary).sort((a, b) => parseInt(a.replace('lesson', '')) - parseInt(b.replace('lesson', ''))); 
        const options = [{ value: 'all', label: _t('count_all_lessons') }, ...lessonKeys.map(key => ({ value: key, label: key.replace('lesson', _t('label_lesson_short') + ' ') }))]; 
        this.lessonMultiSelect.setOptions(options); 
    },
    
    startQuiz() { 
        if (Object.keys(this.state.allVocabulary).length === 0) { this.showMessageBox('no_words_for_lesson'); return; } 
        const selectedLessons = this.lessonMultiSelect.getSelectedValues(); 
        const selectedMode = this.modeSelect.getValue(); 
        const difficulty = this.difficultySelect.getValue(); 
        let sourceVocab = selectedLessons.includes('all') ? Object.values(this.state.allVocabulary).flat() : selectedLessons.flatMap(lesson => this.state.allVocabulary[lesson] || []); 
        sourceVocab = sourceVocab.filter(item => typeof item === 'object' && item !== null && item.w); 
        if (sourceVocab.length === 0) { this.showMessageBox('no_words_for_lesson'); return; } 
        const questionCount = (difficulty === 'all') ? sourceVocab.length : Math.min(sourceVocab.length, parseInt(difficulty)); 
        const quizVocab = this.shuffleArray(sourceVocab).slice(0, questionCount); 
        this.initializeAndRunQuiz(quizVocab, selectedMode); 
    },
    
    initializeAndRunQuiz(vocabList, mode) { 
        if (!vocabList || vocabList.length === 0) { this.showMessageBox('no_words_for_practice'); this.state.isPracticingWrongWords = false; return; } 
        this.showLoadingScreen(); 
        setTimeout(() => { 
            const generatedQuestions = this.generateQuestions(vocabList, mode); 
            if (generatedQuestions.length === 0) { this.showMessageBox('no_questions_generated'); this.resetQuiz(); return; } 
            Object.assign(this.state, { currentQuiz: generatedQuestions, currentQuestion: 0, score: 0, streak: 0, maxStreak: 0, wrongAnswers: [], selectedAnswer: null, startTime: Date.now(), answerLog: [], maxQuestionReachedInSession: 0, }); 
            this.elements.body.classList.add('quiz-mode-active'); 
            this.elements.header.classList.add('hidden-during-quiz'); 
            this.elements.controls.classList.add('hidden-during-quiz'); 
            this.elements.quizContainer.classList.add('immersive-active'); 
            this.showKeyboardHint(); 
            this.showQuestion(); 
        }, 50); 
    },
    
    generateQuestions(vocabList, mode) {
        const wrongOptionPool = this.shuffleArray(Object.values(this.state.allVocabulary).flat());
        let wrongOptionPoolIndex = 0;
        const meaningKey = this.state.currentLanguage === 'en' ? 'm' : 'c';

        const questions = vocabList.map(vocab => {
            const currentMode = mode === 'mixed' ? this.shuffleArray(['reading', 'meaning', 'usage'])[0] : mode;
            let questionData;

            if (currentMode === 'reading' && vocab.r && vocab.w !== vocab.r) {
                questionData = { vocab, mode: 'reading', questionKey: 'w', answerKey: 'r' };
            } else if (currentMode === 'usage' && (vocab.u || vocab.e)) {
                const sourceString = (vocab.u || vocab.e).trim();
                const questionText = ((qs) => qs.length ? qs[Math.floor(Math.random() * qs.length)] : null)(((sourceString.match(/___/g) || []).length > 1 ? sourceString.split(/(?<=。)/) : [sourceString]).map(q => q.trim()).filter(Boolean));
                if (!questionText) return null;
                questionData = { vocab, mode: 'usage', questionText, answerKey: 'w' };
            } else {
                const questionText = `${vocab.w}${vocab.r && vocab.w !== vocab.r ? ` (${vocab.r})` : ''}`;
                questionData = { vocab, mode: 'meaning', questionText, answerKey: meaningKey };
            }
            
            const question = this.generateSingleQuestion(questionData, wrongOptionPool, wrongOptionPoolIndex);
            if (question) {
                wrongOptionPoolIndex = (wrongOptionPoolIndex + 3) % wrongOptionPool.length;
            }
            return question;
        }).filter(Boolean);
        
        return this.shuffleArray(questions);
    },

    generateSingleQuestion({ vocab, mode, questionKey, questionText, answerKey }, pool, poolStartIndex) {
        const questionString = questionText || vocab[questionKey];
        const correctAnswer = vocab[answerKey];
        if (!correctAnswer) return null;

        const wrongOptions = new Set();
        let currentIndex = poolStartIndex;
        while (wrongOptions.size < 3 && currentIndex < pool.length + poolStartIndex) {
            const potentialWrongVocab = pool[currentIndex % pool.length];
            if (potentialWrongVocab.w !== vocab.w) {
                const potentialWrongAnswer = potentialWrongVocab[answerKey];
                if (potentialWrongAnswer && potentialWrongAnswer !== correctAnswer) {
                    wrongOptions.add(potentialWrongVocab);
                }
            }
            currentIndex++;
        }
        if (wrongOptions.size < 3) return null;

        const options = this.shuffleArray([
            { text: correctAnswer, correct: true, vocab: vocab },
            ...Array.from(wrongOptions).map(wrongVocab => ({ text: wrongVocab[answerKey], correct: false, vocab: wrongVocab }))
        ]);

        return { question: questionString, options, correctAnswer, vocab, mode };
    },
    
    showQuestion(options = {}) {
        const { isReviewMode = false } = options;
        clearTimeout(this.state.nextQuestionTimeoutId); 
        if (this.state.currentQuestion >= this.state.currentQuiz.length) { this.showFinalScore(); return; } 
        
        const question = this.state.currentQuiz[this.state.currentQuestion]; 
        const historyEntry = this.state.answerLog.find(log => log.questionIndex === this.state.currentQuestion); 
        
        if (!historyEntry) this.state.questionStartTime = Date.now(); 
        
        this.elements.quizContainer.innerHTML = this.createQuizHTML(question, historyEntry, isReviewMode); 
        this.bindQuizViewEvents(question, historyEntry); 
        this.state.isInputLocked = false; 
    },
    
    createQuizHTML(question, historyEntry, isReviewMode = false) {
        const progress = (this.state.currentQuestion / this.state.currentQuiz.length) * 100; 
        
        const optionsHTML = question.options.map((option, index) => { 
            let baseClasses = 'option interactive-press-effect relative overflow-hidden p-3 md:p-5 rounded-xl cursor-pointer text-base md:text-lg text-center flex items-center justify-center';
            let stateClasses = '';
            let textClasses = 'text-slate-700 dark:text-slate-400 font-medium'; 
            let numberClasses = 'font-bold mr-2 text-indigo-600 dark:text-indigo-300'; 
            if (historyEntry) { 
                stateClasses = ' disabled:opacity-100';
                if (option.correct) { stateClasses += ' !bg-green-600 !text-white !border-green-700'; textClasses = '!text-white font-medium'; numberClasses = '!text-white font-bold mr-3'; } 
                else if (index === historyEntry.selectedOptionIndex) { stateClasses += ' !bg-red-600 !text-white !border-red-700 animate-[incorrectShake_0.3s_ease]'; textClasses = '!text-white font-medium'; numberClasses = '!text-white font-bold mr-3'; } 
            } 
            return `<button class="${baseClasses} ${stateClasses}" data-index="${index}" data-word="${option.vocab.w}" ${historyEntry ? 'disabled' : ''}><span class="${numberClasses}">${index + 1}.</span><span class="${textClasses}">${option.text}</span></button>`;
        }).join(''); 
        
        let feedbackHTML = '', feedbackClass = ''; 
        if (historyEntry) {
            const feedbackMessage = historyEntry.isCorrect ? (isReviewMode ? _t('quiz_correct_feedback') : '') : _t('quiz_incorrect_feedback', { correctAnswer: question.correctAnswer });
            if (feedbackMessage) {
                const detail = _t('quiz_feedback_detail', { word: question.vocab.w, reading_kana: question.vocab.r && question.vocab.w !== question.vocab.r ? ` (${question.vocab.r})` : '', meaning: this.state.currentLanguage === 'en' ? (question.vocab.m || question.vocab.c) : (question.vocab.c || question.vocab.m) }); 
                feedbackClass = historyEntry.isCorrect ? 'correct-inline' : 'incorrect-inline'; 
                feedbackHTML = `${feedbackMessage}<br><small class="block mt-1 opacity-85 text-sm md:text-base text-slate-600 dark:text-slate-500">${detail}</small>`; 
            }
        }
        
        const detailedInfoHTML = (historyEntry && isReviewMode) ? `
            <div id="swipeUpIndicator"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg></div>
            <div id="detailedInfoPanel">
                <div id="panelHandle"></div>
                <h3 class="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 text-center">${_t('detailed_info_title')}</h3>
                <div class="space-y-3 overflow-y-auto">${this.createDetailedInfoContent(question)}</div>
            </div>` : '';
        
        const questionTextCursorClass = question.vocab.e ? 'cursor-pointer' : '';
        const questionTextTitle = question.vocab.e ? _t('quiz_example_hint') : '';

        return ` <div class="w-full h-full flex flex-col"> <button class="exit-btn interactive-press-effect absolute top-3 right-3 w-10 h-10 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 flex items-center justify-center rounded-full text-xl font-semibold z-50 transition hover:scale-110">✕</button> <div class="mb-3 md:mb-8"> <div class="flex justify-between mb-2 font-semibold text-violet-600 dark:text-violet-500"> <span>${_t('quiz_progress', { current: this.state.currentQuestion + 1, total: this.state.currentQuiz.length })}</span> </div> <div class="progress-bar w-full h-2.5 rounded-md overflow-hidden relative"><div class="progress-fill h-full rounded-md" style="width: ${progress}%"></div></div> </div> <div class="stats flex justify-between mb-3 md:mb-5 text-sm md:text-lg font-semibold flex-wrap gap-x-4 gap-y-2"> <span class="flex items-center gap-2 text-green-600 dark:text-green-500"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> ${_t('quiz_correct')} ${this.state.score} </span> <span class="flex items-center gap-2 text-amber-600 dark:text-amber-500"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> ${_t('quiz_streak')} ${this.state.streak} </span> <span class="flex items-center gap-2 text-blue-600 dark:text-blue-500"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clip-rule="evenodd" /></svg> ${_t('quiz_elapsed')} <span id="timer">${historyEntry ? historyEntry.timeSpent : 0}</span>${_t('quiz_seconds')} </span> </div> <div class="question-area-wrapper"> <div class="question-content-area"> <div class="question text-3xl md:text-5xl mb-1 md:mb-2 font-semibold text-center leading-tight text-slate-800 dark:text-slate-200 ${questionTextCursorClass}" id="questionText" title="${questionTextTitle}">${question.question}</div> <div id="exampleSentenceDisplay" class="text-lg px-2 text-slate-600 dark:text-slate-400"></div> </div> </div> <div class="options grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4"> <div id="inlineFeedback" class="inline-feedback-area ${feedbackHTML.trim() ? `show ${feedbackClass}` : ''}" aria-live="polite">${feedbackHTML}</div> ${optionsHTML} </div> </div> ${detailedInfoHTML}`; 
    },
    
    _getOptionStatusInfo(option, index, historyEntry) {
        if (option.correct) {
            return { icon: `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">${_t('status_correct')}</span>`, borderColor: 'border-green-500' };
        }
        if (index === historyEntry.selectedOptionIndex) {
            return { icon: `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white">${_t('status_selected')}</span>`, borderColor: 'border-red-500' };
        }
        return { icon: `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-500 text-white">${_t('status_option')}</span>`, borderColor: 'border-slate-200' };
    },

    // --- MODIFIED: Added data-w and cursor-pointer for audio playback ---
    createDetailedInfoContent(question) {
        const historyEntry = this.state.answerLog.find(log => log.questionIndex === this.state.currentQuestion);
        if (!historyEntry) return '';
        const meaningKey = this.state.currentLanguage === 'en' ? 'm' : 'c';

        return question.options.map((option, index) => {
            if (!option.vocab) return '';
            const { vocab } = option;
            const { icon, borderColor } = this._getOptionStatusInfo(option, index, historyEntry);
            const exampleSentence = vocab.e || vocab.u;

            const wordReadingHTML = vocab.r && vocab.w !== vocab.r
                ? `${vocab.w}<span class="text-base font-normal text-slate-500 dark:text-slate-400 ml-2">(${vocab.r})</span>`
                : vocab.w;
            return `
                <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 border-l-4 ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 detailed-info-item cursor-pointer block w-full mb-3"
                     data-w="${vocab.w}" style="display: block !important; width: 100% !important; margin-bottom: 0.75rem !important;">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white pointer-events-none">${wordReadingHTML}</h3>
                        <span class="rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30 pointer-events-none">${icon}</span>
                    </div>
                    <div class="space-y-1 text-sm pointer-events-none">
                        <div class="grid grid-cols-[auto_1fr] gap-2">
                            <span class="text-gray-500 dark:text-gray-400">${_t('detailed_info_meaning_prefix')}</span>
                            <span class="text-gray-900 dark:text-white">${vocab[meaningKey] || vocab.c || vocab.m}</span>
                        </div>
                        ${exampleSentence ? `<div class="grid grid-cols-[auto_1fr] gap-2">
                            <span class="text-gray-500 dark:text-gray-400">${_t('detailed_info_example_prefix')}</span>
                            <span class="text-gray-900 dark:text-white">${exampleSentence}</span>
                        </div>` : ''}
                    </div>
                </div>`;
        }).join('');
    },
    
    // --- MODIFIED: Simplified by moving logic to bindEvents ---
    bindQuizViewEvents(question, historyEntry) { 
        // Most event handling is now done via delegation in `bindEvents`.
        // This function is now only for logic that MUST run on every question view update.
        if (!historyEntry) { 
            this.updateTimer(); // The timer needs to be started for each new question.
        }
    },
    
    nextQuestion() { 
        if (this.state.currentQuestion + 1 >= this.state.currentQuiz.length) { this.showFinalScore(); return; } 
        this.state.currentQuestion++; 
        if (this.state.currentQuestion > this.state.maxQuestionReachedInSession) { this.state.maxQuestionReachedInSession = this.state.currentQuestion; } 
        this.showQuestion(); 
    },
    
    showFinalScore() { 
        this.resetQuizInterface(); 
        const { score, currentQuiz, maxStreak, wrongAnswers } = this.state; 
        const totalQuestions = currentQuiz.length; 
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0; 
        const totalTime = Math.floor((Date.now() - this.state.startTime) / 1000); 
        const avgTime = totalQuestions > 0 ? (totalTime / totalQuestions).toFixed(1) : 0; 
        const messageKey = percentage >= 90 ? 'final_score_title_90' : percentage >= 70 ? 'final_score_title_70' : percentage >= 50 ? 'final_score_title_50' : 'final_score_title_below_50'; 
        const emoji = percentage >= 90 ? '🏆' : percentage >= 70 ? '🎉' : percentage >= 50 ? '💪' : '📚'; 
        const totalTimeFormatted = totalTime >= 60 ? _t('final_score_minutes_seconds', { minutes: Math.floor(totalTime / 60), seconds: (totalTime % 60).toString().padStart(2, '0') }) : _t('final_score_seconds', { seconds: totalTime }); 
        const wrongAnswersHtml = wrongAnswers.length > 0 ? `<div class="mt-8 text-left animate-[slideUp_0.8s_ease]"><h3 class="text-center text-2xl font-bold mb-5 text-red-600 dark:text-red-400">${_t('final_score_review_needed', { count: wrongAnswers.length })}</h3><div class="max-h-80 overflow-y-auto bg-red-50 dark:bg-red-900/30 rounded-lg p-5 border border-red-200 dark:border-red-700">${wrongAnswers.map(wrong => `<div class="mb-4 p-4 bg-white dark:bg-slate-700/50 rounded-lg border-l-4 border-red-500 shadow-md"><div class="font-bold mb-2 text-lg text-slate-800 dark:text-slate-200">${wrong.question}</div><div class="text-red-600 dark:text-red-400 mb-1">${_t('final_score_your_answer')}: ${wrong.yourAnswer}</div><div class="text-green-600 dark:text-green-400 mb-2">${_t('final_score_correct_answer')}: ${wrong.correctAnswer}</div><div class="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-md text-sm text-slate-600 dark:text-slate-300"><strong class="dark:text-slate-100">${wrong.vocab.w}</strong> ${wrong.vocab.r && wrong.vocab.w !== wrong.vocab.r ? `(${wrong.vocab.r})` : ''}<br>${_t('final_score_original_meaning')}: ${wrong.vocab.c || wrong.vocab.m}<br>${_t('final_score_original_example')}: ${wrong.vocab.e || wrong.vocab.u || _t('final_score_no_example')}</div></div>`).join('')}</div></div>` : ''; 
        this.elements.quizContainer.innerHTML = `<div class="final-score text-center text-3xl font-bold my-8 animate-[fadeIn_1s_ease]"><h2 class="text-4xl text-slate-800 dark:text-slate-100">${emoji} ${_t(messageKey)}</h2><div class="text-indigo-600 dark:text-indigo-400 my-5 text-2xl">${_t('final_score_correct_count', { score, total: totalQuestions })}</div><div class="text-xl mb-5 text-slate-700 dark:text-slate-300">${_t('final_score_percentage', { percentage })}</div><div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-8 text-base"><div class="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg"><div class="font-bold text-green-800 dark:text-green-300">${_t('final_score_max_streak')}</div><div class="text-2xl font-bold text-green-700 dark:text-green-200">${maxStreak}</div></div><div class="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg"><div class="font-bold text-blue-800 dark:text-blue-300">${_t('final_score_total_time')}</div><div class="text-2xl font-bold text-blue-700 dark:text-blue-200">${totalTimeFormatted}</div></div><div class="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg"><div class="font-bold text-indigo-800 dark:text-indigo-300">${_t('final_score_average_time')}</div><div class="text-2xl font-bold text-indigo-700 dark:text-indigo-200">${avgTime}${_t('quiz_seconds')}</div></div></div>${wrongAnswersHtml}<div class="flex gap-4 justify-center mt-8"><button id="restartQuizBtn" class="bg-gradient-to-r from-cyan-400 to-sky-500 text-white font-semibold text-base py-3 px-8 rounded-lg transition-all duration-300 ease-in-out hover:scale-105 hover:brightness-110 interactive-press-effect">${_t('final_score_restart')}</button><button id="reviewWrongBtn" class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold text-base py-3 px-8 rounded-lg transition-all duration-300 ease-in-out hover:brightness-110 interactive-press-effect ${wrongAnswers.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}" ${wrongAnswers.length === 0 ? 'disabled' : ''}>${_t('final_score_review_mode')}</button></div></div>`; 
        this.elements.quizContainer.querySelector('#restartQuizBtn').addEventListener('click', () => this.startQuiz()); 
        if (wrongAnswers.length > 0) { this.elements.quizContainer.querySelector('#reviewWrongBtn').addEventListener('click', () => this.reviewWrongAnswers()); } 
    },
    
    reviewWrongAnswers() { 
        const reviewVocab = this.state.wrongAnswers.map(wrong => wrong.vocab).filter(Boolean); 
        this.initializeAndRunQuiz(reviewVocab, 'mixed'); 
    },
    
    resetQuiz() { 
        this.resetQuizInterface(); 
        this.renderWelcomeMessage(); 
    },
    
    resetQuizInterface() { 
        this.state.isInputLocked = false; 
        clearTimeout(this.state.nextQuestionTimeoutId); 
        clearInterval(this.state.timerInterval); 
        this.elements.body.classList.remove('quiz-mode-active'); 
        this.elements.header.classList.remove('hidden-during-quiz'); 
        this.elements.controls.classList.remove('hidden-during-quiz'); 
        this.elements.quizContainer.classList.remove('immersive-active'); 
        this.hideKeyboardHint(); 
        this.state.isPracticingWrongWords = false;
    },
    
    initializeTheme() { 
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches; 
        this.elements.body.classList.toggle('dark', isSystemDark); 
        this.elements.themeToggleBtn.textContent = isSystemDark ? '☀️' : '🌙'; 
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { 
            this.elements.body.classList.toggle('dark', e.matches); 
            this.elements.themeToggleBtn.textContent = e.matches ? '☀️' : '🌙'; 
            this.updateUIForThemeChange(); 
        }); 
    },
    
    toggleTheme() { 
        const isCurrentlyDark = this.elements.body.classList.toggle('dark'); 
        this.elements.themeToggleBtn.textContent = isCurrentlyDark ? '☀️' : '🌙'; 
        this.updateUIForThemeChange(); 
    },
    
    updateUIForThemeChange() { 
        if (this.elements.body.classList.contains('quiz-mode-active')) this.showQuestion(); 
        if (!this.elements.wrongWordsModal.classList.contains('hidden')) WrongWordsManager.renderList(); 
    },
    
    renderWelcomeMessage() { 
        this.elements.quizContainer.innerHTML = `<div class="welcome-message text-center"><h2 class="text-2xl font-bold mb-5 text-slate-800 dark:text-slate-100">${_t('welcome_message_title')}</h2><p class="text-lg mb-8 leading-relaxed text-slate-700 dark:text-slate-300"><strong>${_t('mode_reading')}:</strong> ${_t('welcome_message_reading')}<br><strong>${_t('mode_meaning')}:</strong> ${_t('welcome_message_meaning')}<br><strong>${_t('mode_usage')}:</strong> ${_t('welcome_message_usage')}<br><strong>${_t('mode_mixed')}:</strong> ${_t('welcome_message_mixed')}</p><div class="features glass-pane mt-8 p-5 rounded-xl"><h3 class="text-center text-xl font-semibold mb-4 gradient-text">${_t('features_title')}</h3><ul class="text-left leading-relaxed list-none list-inside space-y-2 text-slate-700 dark:text-slate-300"><li>${_t('feature_1')}</li> <li>${_t('feature_2')}</li> <li>${_t('feature_3')}</li><li>${_t('feature_6')}</li> <li>${_t('feature_4')}</li> <li>${_t('feature_5')}</li><li>${_t('feature_7')}</li> <li>${_t('feature_8')}</li> <li>${_t('feature_9')}</li></ul></div></div>`; 
    },
    
    showLoadingScreen() { 
        this.elements.quizContainer.innerHTML = `<div class="flex flex-col items-center justify-center h-full"><div class="loading-spinner"></div><p class="mt-4 text-lg font-semibold">${_t('generating_questions')}</p></div>`; 
    },
    
    showKeyboardHint() { 
        if (this.state.sessionHintShown) return; 
        this.elements.keyboardHint.classList.add('opacity-100'); 
        setTimeout(() => this.hideKeyboardHint(), 3000); 
        this.state.sessionHintShown = true; 
    },
    
    hideKeyboardHint() { 
        this.elements.keyboardHint.classList.remove('opacity-100'); 
    },
    
    updateTimer() { 
        clearInterval(this.state.timerInterval); 
        const timerElement = this.elements.quizContainer.querySelector('#timer'); 
        if (timerElement && !this.state.answerLog.some(log => log.questionIndex === this.state.currentQuestion)) { 
            this.state.timerInterval = setInterval(() => { 
                const elapsed = Math.floor((Date.now() - this.state.questionStartTime) / 1000); 
                if (timerElement) timerElement.textContent = elapsed; 
            }, 1000); 
        } 
    },
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (!this.elements.wrongWordsModal.classList.contains('hidden')) WrongWordsManager.closeModal();
            else if (!this.elements.messageBox.classList.contains('hidden')) this.hideMessageBox();
            else if (this.elements.body.classList.contains('quiz-mode-active')) this.elements.quizContainer.querySelector('.exit-btn')?.click();
            return;
        }
        if (!this.elements.body.classList.contains('quiz-mode-active') || !this.elements.wrongWordsModal.classList.contains('hidden')) return;

        if (e.key === ' ') {
            e.preventDefault();
            const detailedInfoPanel = this.elements.quizContainer.querySelector('#detailedInfoPanel');
            if (detailedInfoPanel) {
                detailedInfoPanel.classList.toggle('visible');
            }
        }
        else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.navigateToPreviousQuestion();
        else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.navigateToNextQuestion();
        else if (e.key >= '1' && e.key <= '4' && !this.state.isInputLocked) this.submitAnswer(parseInt(e.key) - 1);
    },
    
    navigateToPreviousQuestion() { 
        if (this.state.currentQuestion > 0) { 
            this.state.currentQuestion--; 
            this.showQuestion({ isReviewMode: true }); 
        } 
    },
    
    navigateToNextQuestion() { 
        const hasBeenAnswered = this.state.answerLog.some(log => log.questionIndex === this.state.currentQuestion); 
        if (hasBeenAnswered && this.state.currentQuestion < this.state.maxQuestionReachedInSession) { 
            this.state.currentQuestion++; 
            this.showQuestion({ isReviewMode: true }); 
        } 
        else if (hasBeenAnswered && this.state.currentQuestion === this.state.maxQuestionReachedInSession) { 
            this.nextQuestion(); 
        } 
    },
    
    handleTouchStart(e) { 
        if (this.elements.body.classList.contains('quiz-mode-active')) { 
            const touch = e.changedTouches[0]; 
            this.state.touchstartX = touch.screenX; 
            this.state.touchstartY = touch.screenY; 
            this.state.touchendX = touch.screenX; 
            this.state.touchendY = touch.screenY; 
            this.state.touchstartTime = Date.now(); 
        } 
    },
    
    handleTouchMove(e) { 
        if (!this.state.touchstartX || !this.state.touchstartY) return; 
        const touch = e.changedTouches[0]; 
        this.state.touchendX = touch.screenX; 
        this.state.touchendY = touch.screenY; 
        if (Math.abs(this.state.touchendX - this.state.touchstartX) > Math.abs(this.state.touchendY - this.state.touchstartY)) { 
            e.preventDefault(); 
        } 
    },
    
    handleTouchEnd(e) {
        if (this.state.touchstartX === 0) return;
        const deltaX = this.state.touchendX - this.state.touchstartX;
        const deltaY = this.state.touchendY - this.state.touchstartY;
        const elapsedTime = Date.now() - this.state.touchstartTime;
        const detailedInfoPanel = this.elements.quizContainer.querySelector('#detailedInfoPanel');

        if (elapsedTime < this.constants.SWIPE_TIME_THRESHOLD) {
            if (detailedInfoPanel && Math.abs(deltaY) > this.constants.SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY < 0) {
                    detailedInfoPanel.classList.add('visible');
                } else if (deltaY > 0 && detailedInfoPanel.classList.contains('visible') && detailedInfoPanel.scrollTop === 0) {
                    detailedInfoPanel.classList.remove('visible');
                }
            } else if (Math.abs(deltaX) > this.constants.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < 0) this.navigateToNextQuestion();
                else this.navigateToPreviousQuestion();
            }
        }
        this.state.touchstartX = 0; this.state.touchstartY = 0; this.state.touchendX = 0; this.state.touchendY = 0; this.state.touchstartTime = 0;
    },
    
    shuffleArray(array) { 
        const shuffled = [...array]; 
        for (let i = shuffled.length - 1; i > 0; i--) { 
            const j = Math.floor(Math.random() * (i + 1)); 
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
        } 
        return shuffled; 
    },
};

document.addEventListener('DOMContentLoaded', () => {
    VocabularyApp.init();
});