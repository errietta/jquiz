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

const puzzle_types = ['puzzle', 'rare_kanji', 'puzzle2'];

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
    }

    setMode(mode) {
        $modes[mode].display = '';
    }

    closeExplanation() {
        $explanation.display = 'none';
        $mode_choice.display = '';
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
        this.lives = 5; // Reset this.lives
        $score.innerText = `Score: ${this.score}`;
        $lives.innerText = `Lives: ${this.lives}`; // Display this.lives
        $game.display = 'block';
        $mode_choice.display = 'none';

        if (puzzle_types.includes(type)) {
            this.defaultTimer = this.timeLeft = 180;
            $input.placeholder = 'Answer in kanji...';
        } else {
            this.defaultTimer = this.timeLeft = 20;
            $input.placeholder = 'Answer in hiragana...';
        }

        this.nextQuestion(this.timeLeft);
    }

    nextQuestion() {
        if (this.words.length === 0 || this.lives <= 0) { // Check if this.lives are exhausted
            this.showGameOverPrompt();
            return;
        }
        this.currentWord = this.words.pop();

        if (this.selectedType === 'puzzle2') {
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
        $game.innerHTML = `
            <div class="container">
                <h2>穴埋め Kanji Quiz</h2>
                <div id="puzzle2_quiz">
                    <div class="puzzle-row">
                        <p id="puzzle2_top">${directions.top}</p>
                    </div>
                    <div class="puzzle-row">
                        <p id="puzzle2_arrow_top">${arrows.top}</p>
                    </div>
                    <div class="puzzle-row">
                        <p id="puzzle2_left">${directions.left}</p>
                        <p id="puzzle2_arrow_left">${arrows.left}</p>
                        <input type="text" class="anaume" id="input" placeholder="Answer here..." autocomplete="off">
                        <p id="puzzle2_arrow_right">${arrows.right}</p>
                        <p id="puzzle2_right">${directions.right}</p>
                    </div>
                    <div class="puzzle-row">
                        <p id="puzzle2_arrow_bottom">${arrows.bottom}</p>
                    </div>
                    <div class="puzzle-row">
                        <p id="puzzle2_bottom">${directions.bottom}</p>
                    </div>
                </div>
                <p>q to skip</p>
                <p id="feedback"></p>
                <p id="timer"></p>
                <p id="score"></p>
                <p id="lives"></p>
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
        if (this.lives <= 0) {
            return;
        }

        this.timeLeft--;
        $timer.innerText = `Time left: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            this.lives--; // Decrease this.lives if time runs out
            $lives.innerText = `Lives: ${this.lives}`; // Update this.lives display
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        }
    }

    checkAnswer() {
        let userAnswer = $input.value.trim();
        if (!userAnswer) {
            return;
        }

        if (userAnswer.toLowerCase() === 'q' || userAnswer.toLowerCase() === 'ｑ') {
            this.lives--;
            if (this.lives <= 0) {
                this.showGameOverPrompt();
            }

            $lives.innerText = `Lives: ${this.lives}`; // Update this.lives display
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
            return;
        }

        if (Array.isArray(this.currentWord.answer) ? this.currentWord.answer.includes(userAnswer) : userAnswer === this.currentWord.answer) {
            this.score++;
            $score.innerText = `Score: ${this.score}`;
            $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        } else {
            this.lives--; // Decrease this.lives if answer is incorrect
            if (this.lives <= 0) {
                $feedback.innerHTML = `Previous answer: ${this.currentWord.answer}`;
                this.showGameOverPrompt();
            }

            $lives.innerText = `Lives: ${this.lives}`; // Update this.lives display
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
