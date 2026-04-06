// ====== CONFIGURACIÓN ======
const API_URL = 'http://localhost:3000/api/auth'; // Tu puerto de Backend

// ====== ELEMENTOS DEL DOM ======
const $authSection = document.querySelector('#auth-section');
const $gameSection = document.querySelector('#game-section');
const $loginForm = document.querySelector('#login-form');
const $registerForm = document.querySelector('#register-form');
const $authMessage = document.querySelector('#auth-message');
const $logoutBtn = document.querySelector('#logout-btn');
const $userDisplayName = document.querySelector('#user-display-name');

// DOM del Juego
const $time = document.querySelector('#time');
const $paragraph = document.querySelector('#paragraph');
const $input = document.querySelector('#input-text');
const $results = document.querySelector('#game-results');
const $wpm = document.querySelector('#wpm');
const $accuracy = document.querySelector('#accuracy');
const $reloadBtn = document.querySelector('#reload-btn');

// ====== ESTADO DEL JUEGO ======
const INITIAL_TIME = 30;
let currentTime = INITIAL_TIME;
let intervalId = null;

const textSample = "el veloz zorro marron salta sobre el perro perezoso un programador refactorizando codigo con clean architecture usando nodejs y mongodb";

// ====== LÓGICA DE AUTENTICACIÓN (Conectando con tu Backend) ======

async function handleAuth(endpoint, bodyData) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Error en la petición');
        
        // Guardar token y mostrar juego
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.name);
        showGameUI();
    } catch (error) {
        $authMessage.textContent = error.message;
    }
}

$loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#login-email').value;
    const password = document.querySelector('#login-password').value;
    handleAuth('login', { email, password });
});

$registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#register-name').value;
    const email = document.querySelector('#register-email').value;
    const password = document.querySelector('#register-password').value;
    handleAuth('register', { name, email, password });
});

$logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    showAuthUI();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) showGameUI();
    else showAuthUI();
}

function showAuthUI() {
    $authSection.style.display = 'block';
    $gameSection.style.display = 'none';
    $authMessage.textContent = '';
}

function showGameUI() {
    $authSection.style.display = 'none';
    $gameSection.style.display = 'block';
    $userDisplayName.textContent = localStorage.getItem('userName');
    initGame();
}

// ====== LÓGICA DEL JUEGO (MonkeyType Clone según el video) ======

function initGame() {
    $results.style.display = 'none';
    $input.value = '';
    currentTime = INITIAL_TIME;
    $time.textContent = currentTime;
    
    clearInterval(intervalId);
    
    // Crear HTML de las palabras
    const words = textSample.split(' ').sort(() => Math.random() - 0.5).slice(0, 32);
    $paragraph.innerHTML = words.map(word => {
        const letters = word.split('').map(letter => `<letter>${letter}</letter>`).join('');
        return `<word>${letters}</word>`;
    }).join('');

    // Activar primera palabra y letra
    const $firstWord = $paragraph.querySelector('word');
    $firstWord.classList.add('active');
    $firstWord.querySelector('letter').classList.add('active');
    
    intervalId = setInterval(countdown, 1000);
}

function countdown() {
    currentTime--;
    $time.textContent = currentTime;
    if (currentTime <= 0) {
        gameOver();
    }
}

function gameOver() {
    clearInterval(intervalId);
    $paragraph.style.display = 'none';
    $input.blur();
    $results.style.display = 'block';

    const $correctLetters = document.querySelectorAll('letter.correct').length;
    const $incorrectLetters = document.querySelectorAll('letter.incorrect').length;
    const totalAttempted = $correctLetters + $incorrectLetters;

    // Calcular WPM y Exactitud
    const accuracy = totalAttempted > 0 ? ($correctLetters / totalAttempted) * 100 : 0;
    const wpm = ($correctLetters / 5) * (60 / INITIAL_TIME);

    $accuracy.textContent = `${accuracy.toFixed(2)}% Exactitud`;
    $wpm.textContent = `${Math.round(wpm)} WPM`;
}

// Eventos de escritura
document.addEventListener('keydown', () => {
    if($gameSection.style.display === 'block') $input.focus();
});

$input.addEventListener('keydown', (e) => {
    const $currentWord = $paragraph.querySelector('word.active');
    const $currentLetter = $currentWord.querySelector('letter.active');

    if (e.key === ' ') {
        e.preventDefault(); // Evitar espacio en el input
        
        const $nextWord = $currentWord.nextElementSibling;
        if (!$nextWord) return gameOver();

        // Marcar la palabra si tiene errores
        const $untyped = $currentWord.querySelectorAll('letter:not(.correct)');
        if ($untyped.length > 0) $currentWord.classList.add('marked');

        // Mover a la siguiente palabra
        $currentWord.classList.remove('active');
        if($currentLetter) $currentLetter.classList.remove('active');
        
        $nextWord.classList.add('active');
        $nextWord.querySelector('letter').classList.add('active');
        $input.value = '';
    }

    if (e.key === 'Backspace') {
        const $prevWord = $currentWord.previousElementSibling;
        const $prevLetter = $currentLetter ? $currentLetter.previousElementSibling : $currentWord.querySelector('letter:last-child');

        if (!$prevLetter && $prevWord && $prevWord.classList.contains('marked')) {
            e.preventDefault();
            $currentWord.classList.remove('active');
            if($currentLetter) $currentLetter.classList.remove('active');
            
            $prevWord.classList.add('active');
            $prevWord.classList.remove('marked');
            
            const $lettersToFix = $prevWord.querySelectorAll('letter');
            $lettersToFix[$lettersToFix.length - 1].classList.add('active');
            
            // Reconstruir el input
            $input.value = Array.from($lettersToFix).map(l => l.classList.contains('correct') ? l.innerText : '').join('');
        }
    }
});

$input.addEventListener('keyup', (e) => {
    if(e.key === ' ' || e.key === 'Backspace') return;
    
    const $currentWord = $paragraph.querySelector('word.active');
    const $currentLetter = $currentWord.querySelector('letter.active');
    
    if (!$currentLetter) return; // Si ya escribió toda la palabra

    const expected = $currentLetter.innerText;
    const typed = $input.value[$input.value.length - 1];

    if (typed === expected) {
        $currentLetter.classList.add('correct');
    } else {
        $currentLetter.classList.add('incorrect');
    }

    $currentLetter.classList.remove('active', 'is-last');
    
    const $nextLetter = $currentLetter.nextElementSibling;
    if ($nextLetter) {
        $nextLetter.classList.add('active');
    } else {
        $currentLetter.classList.add('active', 'is-last');
    }
    
    $input.maxLength = $currentWord.querySelectorAll('letter').length;
});

$reloadBtn.addEventListener('click', () => {
    $paragraph.style.display = 'flex';
    initGame();
});

// Arrancar comprobando autenticación
checkAuth();