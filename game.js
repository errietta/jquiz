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
const display = (id, value) => element(id).display = value;
const placeholder = (id, value) => element(id).placeholder = value;

class GameState {
    words = [];
    currentWord = {};
    score = 0;
    timeLeft = 10;
    timer;
    lives = 5;
    selectedType = 'n5_all';
    defaultTimer = 10;

    setMode(mode) {
        display(mode, '');
    }

    closeExplanation() {
        display('explanation', 'none');
        display('mode_choice', '');
    }

    async fetchVocab(url) {
        display('loading', 'block'); // Show loading indicator
        try {
            return await fetch(url).then(response => response.json());
        } catch (e) {
            console.error('Error fetching vocab:', e);
        } finally {
            display('loading', 'none'); // Hide loading indicator
        }
    }

    async startGame(type) {
        this.selectedType = type; // Store the selected type
        this.words = await this.fetchVocab(`./vocab/${type}.json`);
        this.words = shuffle(this.words).slice(0, 20);
        this.score = 0;
        this.lives = 5; // Reset this.lives
        element('score').innerText = `Score: ${this.score}`;
        element('lives').innerText = `Lives: ${this.lives}`; // Display this.lives
        display('game', 'block');
        display('mode_choice', 'none');

        if (['puzzle'].includes(type)) {
            this.defaultTimer = this.timeLeft = 180;
            placeholder('input', 'Answer in kanji...');
        } else {
            this.defaultTimer = this.timeLeft = 10;
            placeholder('input', 'Answer in hiragana...');
        }

        this.nextQuestion(this.timeLeft);
    }

    nextQuestion() {
        if (this.words.length === 0 || this.lives <= 0) { // Check if this.lives are exhausted
            this.showGameOverPrompt();
            return;
        }
        this.currentWord = this.words.pop();
        if (['puzzle'].includes(this.selectedType)) {
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
            this.defaultTimer = this.timeLeft = 10;
        }


        element('question').innerText = this.currentWord.question;
        element('input').value = '';

        this.timeLeft = this.defaultTimer;
        element('timer').innerText = `Time left: ${this.timeLeft}s`;

        clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    showGameOverPrompt() {
        element('finalScore').innerText = this.score;
        display('gameOverPrompt', 'block');

        element('yesButton').onclick = () => {
            display('gameOverPrompt', 'none');
            this.startGame(this.selectedType); // Restart the game with the previously selected type
        };

        element('noButton').onclick = () => {
            location.reload(); // Refresh the page
        };
    }

    updateTimer() {
        if (this.lives <= 0) {
            return;
        }

        this.timeLeft--;
        element('timer').innerText = `Time left: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            this.lives--; // Decrease this.lives if time runs out
            element('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
            element('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        }
    }

    checkAnswer() {
        let userAnswer = element('input').value.trim();
        if (!userAnswer) {
            return;
        }

        if (userAnswer.toLowerCase() === 'q' || userAnswer.toLowerCase() === 'ｑ') {
            this.lives--;
            if (this.lives <= 0) {
                this.showGameOverPrompt();
            }

            element('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
            element('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
            return;
        }

        if (Array.isArray(this.currentWord.answer) ? this.currentWord.answer.includes(userAnswer) : userAnswer === this.currentWord.answer) {
            this.score++;
            element('score').innerText = `Score: ${this.score}`;
            element('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        } else {
            this.lives--; // Decrease this.lives if answer is incorrect
            if (this.lives <= 0) {
                element('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
                this.showGameOverPrompt();
            }
            
            element('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
        }
        element('input').value = '';
    }

}

let gameState = new GameState();

var isComposing = false; // IME Composing going on
var hasCompositionJustEnded = false; // Used to swallow keyup event related to compositionend

const txt = element('input');

txt.addEventListener('keyup', function (event) {
    if (isComposing || hasCompositionJustEnded) {
        // IME composing fires keydown/keyup events
        hasCompositionJustEnded = false;
        return;
    }

    console.log({event});

    if (event.which === 13) {
        gameState.checkAnswer();
    }
});
txt.addEventListener('compositionstart', function (event) {
    isComposing = true;
});

txt.addEventListener('compositionend', function (event) {
    isComposing = false;
    // some browsers (IE, Firefox, Safari) send a keyup event after
    // compositionend, some (Chrome, Edge) don't. This is to swallow
    // the next keyup event, unless a keydown event happens first
    hasCompositionJustEnded = true;
});

txt.addEventListener('keydown', function (event) {
    // Safari on OS X may send a keydown of 229 after compositionend
    if (event.which !== 229) {
        hasCompositionJustEnded = false;
    }
});

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