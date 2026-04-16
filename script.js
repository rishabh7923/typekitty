let words = [];

const GAME_TIME = 30 * 1000;
window.timer = null;
window.gameStartTime = null;


function addClass(el, name) {
    el.className += ' ' + name;
}

function removeClass(el, name) {
    el.className = el.className.replace(name, '');
}

function randomWord() {
    const randomIndex = Math.ceil(Math.random() * words.length);
    return words[randomIndex - 1];
}

function formatWord(word) {
    const spannedWords = word.split('')
        .map(char => `<span class="letter">${char}</span>`).join('')

    return `<div class="word">${spannedWords}</div>`
}

function updateCursorPosition() {
    const cursor = document.getElementById('cursor');
    const game = document.getElementById('game');
    const currentLetter = document.querySelector('.letter.current');
    const currentWord = document.querySelector('.word.current');
    const target = currentLetter || currentWord;

    if (!cursor || !game || !target) return;

    const targetRect = target.getBoundingClientRect();
    const gameRect = game.getBoundingClientRect();

    cursor.style.top = targetRect.top - gameRect.top + 2 + 'px';
    cursor.style.left = (currentLetter ? targetRect.left : targetRect.right) - gameRect.left + 'px';
}

function newGame() {
    document.getElementById('words').innerHTML = '';

    for (let i = 0; i < 200; i++) {
        document.getElementById('words')
            .innerHTML += formatWord(randomWord())
    }

    addClass(document.querySelector('.word'), 'current')
    addClass(document.querySelector('.letter'), 'current')
    removeClass(document.getElementById('game'), 'over')

    document.getElementById('game-top-info').innerHTML = (GAME_TIME / 1000) + '';
    updateCursorPosition();
    window.timer = null;
}

function getWPM() {
    const writtenWords = [...document.querySelectorAll('.word')];
    const typedWords = writtenWords.slice(0, writtenWords.indexOf(document.querySelector('.word.current')))

    const correctedWords = typedWords.filter(word => {
        return word.querySelectorAll('.letter.incorrect').length == 0
    })

    return correctedWords.length / GAME_TIME * 60000;
}

function gameOver() {
    clearInterval(window.timer);
    addClass(document.getElementById('game'), 'over');
    document.getElementById('game-top-info').innerHTML = `WPM: ${getWPM()}`
}

(async () => {
    words = await fetch('public/words.txt')
        .then(response => response.text())
        .then(data => data.split('\r\n'))


    document.getElementById('game').addEventListener('keyup', (ev) => {
        const key = ev.key;

        const currentLetter = document.querySelector('.letter.current');
        const currentWord = document.querySelector('.word.current')

        const expected = currentLetter?.innerHTML || ' ';

        const isSpace = key === ' ';
        const isLetter = key.length === 1 && !isSpace;
        const isBackspace = key === 'Backspace'
        const isFirstLetter = currentWord.firstChild === currentLetter;

        if (document.querySelector('#game.over')) return;

        console.log({ key, expected })

        if (!window.timer && isLetter) {
            window.timer = setInterval(() => {
                if(!window.gameStartTime) window.gameStartTime = new Date().getTime();
                const timeLeft = Math.round((GAME_TIME - (new Date().getTime() - window.gameStartTime)) / 1000)

                if (timeLeft <= 0) return gameOver();

                document.getElementById('game-top-info').innerHTML = timeLeft
            }, 1000)
        }

        if (isLetter) {
            if (currentLetter) {
                addClass(currentLetter, key == expected ? 'correct' : 'incorrect');
                removeClass(currentLetter, 'current');

                if (currentLetter.nextSibling)
                    addClass(currentLetter.nextSibling, 'current');
            } else {
                const incorrectLetter = document.createElement('span');
                incorrectLetter.innerHTML = key;
                incorrectLetter.className = 'letter incorrect extra';
                currentWord.append(incorrectLetter);
            }
        }

        if (isSpace) {
            if (expected !== ' ') {
                const lettersToInvalidate = [...document
                    .querySelectorAll('.word.current .letter:not(.correct)')]

                lettersToInvalidate.forEach(letter => addClass(letter, 'incorrect'))
            }

            removeClass(currentWord, 'current');
            addClass(currentWord.nextSibling, 'current');

            if (currentLetter) removeClass(currentLetter, 'current');
            addClass(currentWord.nextSibling.firstChild, 'current');
        }

        if (isBackspace) {
            if (currentLetter && isFirstLetter) {
                removeClass(currentWord, 'current');
                addClass(currentWord.previousSibling, 'current');

                removeClass(currentLetter, 'current');
            }

            if (currentLetter && !isFirstLetter) {
                removeClass(currentLetter, 'current');
                addClass(currentLetter.previousSibling, 'current');

                removeClass(currentLetter.previousSibling, 'correct');
                removeClass(currentLetter.previousSibling, 'incorrect');
            }

            if (!currentLetter) {
                addClass(currentWord.lastChild, 'current');
                removeClass(currentWord.lastChild, 'correct');
                removeClass(currentWord.lastChild, 'incorrect');
            }
        }
        
        if (currentWord.getBoundingClientRect().top > 250) {
            const words = document.getElementById('words');
            const margin = parseInt(words.style.marginTop || '0px');
            words.style.marginTop = (margin - 35) + 'px';
        }

        updateCursorPosition();

    })

    document.getElementById('new-game-button').addEventListener('click', () => {
        gameOver();
        newGame();
    })

    newGame();

})();

