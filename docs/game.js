const element = id => {
  let el = document.getElementById(id);
  if (!Object.hasOwn(el, 'display')) {
    Object.defineProperty(el, 'display', {
      get () { return this.style.display },
      set (v) { return this.style.display = v },
    });
  }
  return el;
};

let {
  $score,
  $lives,
  $question,
  $input,
  $timer,
  $finalScore,
  $yesButton,
  $noButton,
  $feedback,
  $explanation,
  $mode_choice,
  $loading,
  $game,
  $gameOverPrompt,
  jlpt_mode,
  quiz_mode,
} = new Proxy ({}, {
  get (_, prop) { return element(prop.replace(/^\$/, '')) }
});

const $modes = { jlpt_mode, quiz_mode };

const puzzle_types = ['puzzle', 'rare_kanji', 'puzzle2', 'puzzle3'];
const ume_types = [ 'puzzle2', 'puzzle3' ];

let settings = {
    disableLives: false,
    disableTimer: false,
};

function openSettings() {
    element('settingsModal').display = 'block';
}

function closeSettings() {
    element('settingsModal').display = 'none';
}

function toggleSetting(setting) {
    settings[setting] = !settings[setting];
}

class GameState {
    words = [];
    currentWord = {};
    score = 0;
    timeLeft = 20;
    timer;
    lives = 5;
    selectedType = 'n5_all';
    defaultTimer = 20;

    isComposing = false;
    hasCompositionJustEnded = false;

    constructor() {
        this.attachInputListeners($input);
        this.setupHistoryManagement();
        this.createBackPrompt();

        if (window.Capacitor) {
            this.setupCapacitorBackButton();
        }
    }

    setupCapacitorBackButton() {
        console.log('Setting up Capacitor back button listener');
        const { App } = window.Capacitor.Plugins;

        App.addListener('backButton', ({ canGoBack }) => {
            console.warn('BACK', this.currentState);
            if (this.currentState.page === 'quiz') {
                element('backPrompt').style.display = 'block';
            } else if (this.currentState.page === 'picked_mode') {
                this.showModeChoice();
            }
            else if (this.currentState.page === 'mode_choice') {
                this.goHome();
            } else if (this.currentState.page === 'home') {
                App.exitApp();
            } else if (canGoBack) {
                history.back();
            }
        });
    }

    createBackPrompt() {
        const backPrompt = document.createElement('div');
        backPrompt.id = 'backPrompt';
        backPrompt.style.display = 'none';
        backPrompt.style.position = 'fixed';
        backPrompt.style.top = '50%';
        backPrompt.style.left = '50%';
        backPrompt.style.transform = 'translate(-50%, -50%)';
        backPrompt.style.background = 'rgba(0, 0, 0, 0.8)';
        backPrompt.style.padding = '20px';
        backPrompt.style.borderRadius = '10px';
        backPrompt.style.color = '#fff';
        backPrompt.style.textAlign = 'center';
        backPrompt.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        backPrompt.innerHTML = `
            <p>Are you sure you want to quit the quiz and go back?</p>
            <button class="button" id="backPromptYes" style="margin: 5px; padding: 8px 16px; background: #f44336; color: #fff; border: none; border-radius: 5px; cursor: pointer;">Yes</button>
            <button class="button" id="backPromptNo" style="margin: 5px; padding: 8px 16px; background: #4caf50; color: #fff; border: none; border-radius: 5px; cursor: pointer;">No</button>
        `;
        document.body.appendChild(backPrompt);

        document.getElementById('backPromptYes').onclick = () => {
            this.endGame();
            this.showModeChoice();
            backPrompt.style.display = 'none';
        };

        document.getElementById('backPromptNo').onclick = () => {
            history.pushState({ page: 'quiz' }, 'Quiz'); // Revert to quiz state
            backPrompt.style.display = 'none';
        };
    }

    pushState(state, name) {
        console.log('Pushing state:', state, name);
        history.pushState(state, name);
        this.currentState = state;
    }

    setMode(mode) {
        this.pushState({ page: 'picked_mode' }, 'Mode Choice');

        Object.keys($modes).forEach(key => {
            $modes[key].display = 'none';
        });

        $modes[mode].display = 'block';
    }

    setupHistoryManagement() {
        window.onpopstate = (event) => {
            console.log('onpop', event, event.state);
            if (event.state && this.currentState.page === 'quiz') {
                element('backPrompt').style.display = 'block'; // Show the custom back prompt
            } else if (event.state && (event.state.page === 'mode_choice')) {
                this.showModeChoice();
            }
            else if (event.state && event.state.page === 'home') {
                this.endGame();
                this.goHome();
            }
        };
    }

    goHome() {
        $mode_choice.display = 'none';
        $explanation.display = '';
        this.pushState({ page: 'home' }, 'Home');
    }

    showModeChoice() {
        this.pushState({ page: 'mode_choice' }, 'Mode Choice');

        $game.display = 'none';
        $mode_choice.display = '';
        Object.keys($modes).forEach(key => {
            $modes[key].display = 'none';
        });
    }

    closeExplanation() {
        $explanation.display = 'none';
        $mode_choice.display = '';
        this.pushState({ page: 'mode_choice' }, 'Mode Choice');
    }

    async fetchVocab(url) {
        $loading.display = 'block'; // Show loading indicator
        try {
            return await fetch(url).then(response => response.json());
        } catch (e) {
            console.error('Error fetching vocab:', e);
        } finally {
            $loading.display = 'none'; // Hide loading indicator
        }
    }

    async startGame(type) {
        this.selectedType = type; // Store the selected type
        this.words = await this.fetchVocab(`./vocab/${type}.json`);
        this.words = shuffle(this.words).slice(0, 20);
        this.score = 0;
        this.lives = settings.disableLives ? Infinity : 5; // Disable lives if setting is enabled
        $score.innerText = `Score: ${this.score}`;
        $lives.innerText = settings.disableLives ? 'Lives: ∞' : `Lives: ${this.lives}`;
        $game.display = 'block';
        $mode_choice.display = 'none';

        if (puzzle_types.includes(type)) {
            this.defaultTimer = settings.disableTimer ? Infinity : 180; // Disable timer if setting is enabled
            $input.placeholder = 'Answer in kanji...';
        } else {
            this.defaultTimer = settings.disableTimer ? Infinity : 20;
            $input.placeholder = 'Answer in hiragana...';
        }

        this.timeLeft = this.defaultTimer;
        this.nextQuestion();

        this.pushState({ page: 'quiz' }, 'Quiz');
    }

    endGame() {
        clearInterval(this.timer);
        $game.display = 'none';
        $mode_choice.display = 'none';
    }

    nextQuestion() {
        if (this.words.length === 0 || this.lives <= 0) { // Check if this.lives are exhausted
            this.showGameOverPrompt();
            return;
        }
        this.currentWord = this.words.pop();

        if (ume_types.includes(this.selectedType)) {
            $game.display = 'none';
            element('game').display = 'block';
            this.handlePuzzle2();
            return;
        }

        if (puzzle_types.includes(this.selectedType)) {
            const options = this.currentWord.question.split("　");
            let questionParts = options.map(option => {
                if (option.match(';')) {
                    console.log("multiple hints detected, original ", option);
                    let possibleHints = option
                        .split(';')
                        .filter(hint => hint.match("◯"));

                    return shuffle(possibleHints)[0];
                } else {
                    return option;
                }
            });
            let builtQuestion = questionParts
                .map(part => part + "　")
                .join('');
            console.log("going with ", builtQuestion);
            this.currentWord.question = builtQuestion;
        } else {
            this.defaultTimer = this.timeLeft = 20;
        }


        $question.innerText = this.currentWord.question;
        $input.value = '';

        this.timeLeft = this.defaultTimer;
        $timer.innerText = `Time left: ${this.timeLeft}s`;

        clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    attachInputListeners(inputElement) {
        inputElement.addEventListener('keyup', (event) => {
            if (this.isComposing || this.hasCompositionJustEnded) {
                this.hasCompositionJustEnded = false;
                return;
            }
            if (event.which === 13) {
                this.checkAnswer();
            }
        });

        inputElement.addEventListener('compositionstart', () => {
            this.isComposing = true;
        });

        inputElement.addEventListener('compositionend', () => {
            this.isComposing = false;
            this.hasCompositionJustEnded = true;
        });

        inputElement.addEventListener('keydown', (event) => {
            if (event.which !== 229) {
                this.hasCompositionJustEnded = false;
            }
        });
    }

    refreshElements() {
        ({
            $score,
            $lives,
            $input,
            $timer,
            $finalScore,
            $yesButton,
            $noButton,
            $feedback,
            $explanation,
            $mode_choice,
            $loading,
            $game,
            $gameOverPrompt,
            jlpt_mode,
            quiz_mode,
        } = new Proxy({}, {
            get(_, prop) { return element(prop.replace(/^\$/, '')) }
        }));
    }

    handlePuzzle2() {
        const question = this.currentWord.question;
        const directions = { top: '', left: '', right: '', bottom: '' };
        const arrows = { top: '', left: '', right: '', bottom: '' };

        question.forEach((q) => {
            if (q.startsWith('◯')) {
                if (!directions.top) {
                    directions.top = q.slice(1); // Character after ◯
                    arrows.top = '↑';
                } else if (!directions.left) {
                    directions.left = q.slice(1);
                    arrows.left = '←';
                } else if (!directions.right) {
                    directions.right = q.slice(1);
                    arrows.right = '→';
                } else if (!directions.down) {
                    directions.right = q.slice(1);
                    arrows.right = '↓';
                }
            } else if (q.endsWith('◯')) {
                if (!directions.top) {
                    directions.top = q.slice(0, -1); // Character before ◯
                    arrows.top = '↓';
                } else if (!directions.left) {
                    directions.left = q.slice(0, -1);
                    arrows.left = '→';
                } else if (!directions.right) {
                    directions.right = q.slice(0, -1);
                    arrows.right = '←';
                } else if (!directions.bottom) {
                    directions.bottom = q.slice(0, -1);
                    arrows.bottom = '↑';
                }
            }
        });

        const feedbackHTML = element("feedback").innerHTML;

        this.addPuzzle2Display(directions, arrows);
        this.refreshElements();

        // Reset input and timer
        this.timeLeft = this.defaultTimer;
        $timer.innerText = `Time left: ${this.timeLeft}s`;
        clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimer(), 1000);

        // Attach event listeners to the new input element
        const newInput = element('input');
        this.attachInputListeners(newInput);
        newInput.placeholder = '';

        $score.innerText = `Score: ${this.score}`;
        $lives.innerText = `Lives: ${this.lives}`; // Display this.lives

        element("feedback").innerHTML = feedbackHTML;
    }

    addPuzzle2Display(directions, arrows) {
        // Update the layout to include the thinking image next to timer, score, and lives
        $game.innerHTML = `
            <div class="container">
                <h2>穴埋め Kanji Quiz</h2>
                <div id="puzzle2_quiz">
                    <div class="puzzle-row">
                        <div id="puzzle2_top">${directions.top}</div>
                    </div>
                    <div class="puzzle-row">
                        <div id="puzzle2_arrow_top">${arrows.top}</div>
                    </div>
                    <div class="puzzle-row">
                        <div id="puzzle2_left">${directions.left}</div>
                        <div id="puzzle2_arrow_left">${arrows.left}</div>
                        <input type="text" class="anaume" id="input" placeholder="Answer here..." autocomplete="off">
                        <div id="puzzle2_arrow_right">${arrows.right}</div>
                        <div id="puzzle2_right">${directions.right}</div>
                    </div>
                    <div class="puzzle-row">
                        <div id="puzzle2_arrow_bottom">${arrows.bottom}</div>
                    </div>
                    <div class="puzzle-row">
                        <div id="puzzle2_bottom">${directions.bottom}</div>
                    </div>
                </div>
                <div>q to skip</div>
                <div id="feedback"></div>
                <div style="display: flex; align-items: center; justify-content: center; margin-top: 10px;">
                    <img src="images/think.png" id="thinking" alt="Thinking image" style="height: 50px;"/>
                    <div id="timer" style="margin-right: 15px;"></div>
                    <div id="score" style="margin-right: 15px;"></div>
                    <div id="lives" style="margin-right: 15px;"></div>
                </div>
            </div>
        `;
    }

    showGameOverPrompt() {
        $finalScore.innerText = this.score;
        $gameOverPrompt.display = 'block';

        $yesButton.onclick = () => {
            $gameOverPrompt.display = 'none';
            this.startGame(this.selectedType); // Restart the game with the previously selected type
        };

        $noButton.onclick = () => {
            location.reload(); // Refresh the page
        };
    }

    updateTimer() {
        if (settings.disableTimer || this.lives <= 0) {
            return;
        }

        this.timeLeft--;
        $timer.innerText = `Time left: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            if (!settings.disableLives) {
                this.lives--;
                $lives.innerText = `Lives: ${this.lives}`;
            }
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        }
    }

    checkAnswer() {
        let userAnswer = $input.value.trim();
        if (!userAnswer) {
            return;
        }

        const thinkingImage = document.getElementById('thinking');

        if (userAnswer.toLowerCase() === 'q' || userAnswer.toLowerCase() === 'ｑ') {
            if (!settings.disableLives) {
                this.lives--;
                if (this.lives <= 0) {
                    this.showGameOverPrompt();
                }
                $lives.innerText = `Lives: ${this.lives}`;
            }
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            thinkingImage.src = "images/think.png"; // Reset to thinking image
            this.nextQuestion();
            return;
        }

        if (Array.isArray(this.currentWord.answer) ? this.currentWord.answer.includes(userAnswer) : userAnswer === this.currentWord.answer) {
            this.score++;
            $score.innerText = `Score: ${this.score}`;
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            thinkingImage.src = "images/ok.png"; // Change to correct image
            this.nextQuestion();
        } else {
            if (!settings.disableLives) {
                this.lives--;
                if (this.lives <= 0) {
                    $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
                    this.showGameOverPrompt();
                }
                $lives.innerText = `Lives: ${this.lives}`;
            }
            thinkingImage.src = "images/think.png"; // Reset to thinking image
        }
        $input.value = '';
    }

}

let gameState = new GameState();


function shuffle(array) {
    array = [ ...array ]; // avoid mutating input
    for (const i of [ ...array.keys() ].toReversed()) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// for the HTML onClick stuff
globalThis.setMode = gameState.setMode.bind(gameState);
globalThis.startGame = gameState.startGame.bind(gameState);
globalThis.closeExplanation = gameState.closeExplanation.bind(gameState);
