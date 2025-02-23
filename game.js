let words = [];
let currentWord = {};
let score = 0;
let timeLeft = 10;
let timer;
let lives = 5;
let selectedType = 'n5_all';
let defaultTimer = 10;

function setMode(mode) {
    document.getElementById(mode).style.display='';
}

function closeExplanation() {
    document.getElementById('explanation').style.display = 'none';
    document.getElementById('mode_choice').style.display = '';
}

async function startGame(type) {
    selectedType = type; // Store the selected type
    const response = await fetch(`./vocab/${type}.json`);
    words = await response.json();
    words = shuffle(words).slice(0, 20);
    score = 0;
    lives = 5; // Reset lives
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('lives').innerText = `Lives: ${lives}`; // Display lives
    document.getElementById('game').style.display = 'block';
    document.getElementById('mode_choice').style.display = 'none';

    if (['puzzle'].includes(type)) {
        defaultTimer = timeLeft = 180;
    } else {
        defaultTimer = timeLeft = 10;
    }

    nextQuestion(timeLeft);
}

function nextQuestion() {
    if (words.length === 0 || lives <= 0) { // Check if lives are exhausted
        showGameOverPrompt();
        return;
    }
    currentWord = words.pop();

    document.getElementById('question').innerText = currentWord.question;
    document.getElementById('input').value = '';

    timeLeft = defaultTimer;
    document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;

    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

function showGameOverPrompt() {
    document.getElementById('finalScore').innerText = score;
    const gameOverPrompt = document.getElementById('gameOverPrompt');
    gameOverPrompt.style.display = 'block';

    document.getElementById('yesButton').onclick = () => {
        gameOverPrompt.style.display = 'none';
        startGame(selectedType); // Restart the game with the previously selected type
    };

    document.getElementById('noButton').onclick = () => {
        location.reload(); // Refresh the page
    };
}

function updateTimer() {
    if (lives <= 0) {
        return;
    }

    timeLeft--;
    document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
        clearInterval(timer);
        lives--; // Decrease lives if time runs out
        document.getElementById('lives').innerText = `Lives: ${lives}`; // Update lives display
        document.getElementById('feedback').innerHTML = `Previous answer: ${currentWord.answer}`;
        nextQuestion();
    }
}

function checkAnswer() {
    let userAnswer = document.getElementById('input').value.trim();
    if (!userAnswer) {
        return;
    }

    if (userAnswer === 'q') {
        lives--;
        document.getElementById('lives').innerText = `Lives: ${lives}`; // Update lives display
        document.getElementById('feedback').innerHTML = `Previous answer: ${currentWord.answer}`;
        nextQuestion();
        return;
    }

    if (Array.isArray(currentWord.answer) ? currentWord.answer.includes(userAnswer) : userAnswer === currentWord.answer) {
        score++;
        document.getElementById('score').innerText = `Score: ${score}`;
        document.getElementById('feedback').innerHTML = `Previous answer: ${currentWord.answer}`;
        nextQuestion();
    } else {
        lives--; // Decrease lives if answer is incorrect
        document.getElementById('lives').innerText = `Lives: ${lives}`; // Update lives display
    }
    document.getElementById('input').value = '';
}

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
        checkAnswer();
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