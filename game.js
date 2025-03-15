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
        document.getElementById(mode).style.display='';
    }

    closeExplanation() {
        document.getElementById('explanation').style.display = 'none';
        document.getElementById('mode_choice').style.display = '';
    }

    fetchVocab(url) {
        document.getElementById('loading').style.display = 'block'; // Show loading indicator
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                document.getElementById('loading').style.display = 'none'; // Hide loading indicator
                return data;
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none'; // Hide loading indicator
                console.error('Error fetching vocab:', error);
            });
    }

    async startGame(type) {
        this.selectedType = type; // Store the selected type
        this.words = await this.fetchVocab(`./vocab/${type}.json`);
        this.words = shuffle(this.words).slice(0, 20);
        this.score = 0;
        this.lives = 5; // Reset this.lives
        document.getElementById('score').innerText = `Score: ${this.score}`;
        document.getElementById('lives').innerText = `Lives: ${this.lives}`; // Display this.lives
        document.getElementById('game').style.display = 'block';
        document.getElementById('mode_choice').style.display = 'none';

        if (['puzzle'].includes(type)) {
            this.defaultTimer = this.timeLeft = 180;
            document.getElementById('input').setAttribute('placeholder', 'Answer in kanji...');
        } else {
            this.defaultTimer = this.timeLeft = 10;
            document.getElementById('input').setAttribute('placeholder', 'Answer in hiragana...');
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
            let buildQuestion = "";
            options.map(option => {
                if (option.match(';')) {
                    console.log("multiple hints detected, original ", option);
                    let multipleOptions = option.split(';');
                    let possibleHints = [];
                    multipleOptions.map(hint => {
                        if (hint.match("◯")) {
                            possibleHints.push(hint);
                        }     
                    });

                    possibleHints = shuffle(possibleHints);
                    buildQuestion += possibleHints[0] + "　";
                } else {
                    buildQuestion += option + "　";
                }
            });
            console.log("going with ", buildQuestion);
            this.currentWord.question = buildQuestion;
        } else {
            this.defaultTimer = this.timeLeft = 10;
        }


        document.getElementById('question').innerText = this.currentWord.question;
        document.getElementById('input').value = '';

        this.timeLeft = this.defaultTimer;
        document.getElementById('timer').innerText = `Time left: ${this.timeLeft}s`;

        clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }

    showGameOverPrompt() {
        document.getElementById('finalScore').innerText = this.score;
        const gameOverPrompt = document.getElementById('gameOverPrompt');
        gameOverPrompt.style.display = 'block';

        document.getElementById('yesButton').onclick = () => {
            gameOverPrompt.style.display = 'none';
            this.startGame(this.selectedType); // Restart the game with the previously selected type
        };

        document.getElementById('noButton').onclick = () => {
            location.reload(); // Refresh the page
        };
    }

    updateTimer() {
        if (this.lives <= 0) {
            return;
        }

        this.timeLeft--;
        document.getElementById('timer').innerText = `Time left: ${this.timeLeft}s`;
        if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            this.lives--; // Decrease this.lives if time runs out
            document.getElementById('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
            document.getElementById('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        }
    }

    checkAnswer() {
        let userAnswer = document.getElementById('input').value.trim();
        if (!userAnswer) {
            return;
        }

        if (userAnswer.toLowerCase() === 'q' || userAnswer.toLowerCase() === 'ｑ') {
            this.lives--;
            if (this.lives <= 0) {
                this.showGameOverPrompt();
            }

            document.getElementById('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
            document.getElementById('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
            return;
        }

        if (Array.isArray(this.currentWord.answer) ? this.currentWord.answer.includes(userAnswer) : userAnswer === this.currentWord.answer) {
            this.score++;
            document.getElementById('score').innerText = `Score: ${this.score}`;
            document.getElementById('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
            this.nextQuestion();
        } else {
            this.lives--; // Decrease this.lives if answer is incorrect
            if (this.lives <= 0) {
                document.getElementById('feedback').innerHTML = `Previous answer: ${this.currentWord.answer}`;
                this.showGameOverPrompt();
            }
            
            document.getElementById('lives').innerText = `Lives: ${this.lives}`; // Update this.lives display
        }
        document.getElementById('input').value = '';
    }

}

let gameState = new GameState();

var isComposing = false; // IME Composing going on
var hasCompositionJustEnded = false; // Used to swallow keyup event related to compositionend

const txt = document.getElementById('input');

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
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// for the HTML onClick stuff
globalThis.setMode = gameState.setMode.bind(gameState);
globalThis.startGame = gameState.startGame.bind(gameState);
globalThis.closeExplanation = gameState.closeExplanation.bind(gameState);