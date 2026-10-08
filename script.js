/* --- AUDIO SYNTHESIS SYSTEM --- */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function getVolume() {
  return parseInt(document.getElementById('volume-slider').value) / 10;
}

function updateVolumeText() {
  document.getElementById('vol-display').innerText = document.getElementById('volume-slider').value;
}

function playTone(freq, type, duration, volScale = 1) {
  if (!audioCtx) initAudio();
  const vol = getVolume();
  if (vol === 0) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(vol * volScale, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playJumpSound() {
  playTone(300, 'sine', 0.2, 0.8);
  setTimeout(() => playTone(500, 'sine', 0.3, 0.8), 50);
}

function playYaySound() {
  playTone(400, 'triangle', 0.1, 0.5);
  setTimeout(() => playTone(500, 'triangle', 0.1, 0.5), 100);
  setTimeout(() => playTone(600, 'triangle', 0.2, 0.5), 200);
  setTimeout(() => playTone(800, 'triangle', 0.4, 0.5), 300);
}

function playBooSound() {
  playTone(300, 'sawtooth', 0.3, 0.4);
  setTimeout(() => playTone(250, 'sawtooth', 0.3, 0.4), 200);
  setTimeout(() => playTone(150, 'sawtooth', 0.6, 0.4), 400);
}

/* --- GAME LOGIC --- */
const questionImages = ['🍬', '🍎', '🐶', '🚗', '🎈', '⭐', '🍓', '🐸'];
let correctAnswerIndex = 0;
let isAnimating = false;
let rightCount = 0;
let wrongCount = 0;

function loadNextQuestion() {
  if (isAnimating) return;
  document.querySelectorAll('.confetti, .boo-text').forEach(el => el.remove());

  const turtle = document.getElementById('turtle');
  const stand = document.getElementById('levitating-board');

  turtle.style.transition = 'none';
  turtle.classList.add('idle-float');
  turtle.style.top = '175px';
  turtle.style.left = '350px'; 
  turtle.style.opacity = '1';

  // restart turtle + stand animations together so they bob in perfect sync
  turtle.style.animation = 'none';
  stand.style.animation = 'none';
  void turtle.offsetWidth; // force reflow
  turtle.style.animation = '';
  stand.style.animation = '';
  
  setTimeout(() => { 
    turtle.style.transition = 'left 0.5s cubic-bezier(0.25, 1, 0.5, 1), top 0.5s cubic-bezier(0.25, 1, 0.5, 1)'; 
  }, 50);
  
  for (let i = 0; i < 4; i++) {
    document.getElementById('board-' + i).style.animation = 'none';
  }
  document.querySelectorAll('.spring-coil').forEach(s => s.style.animation = 'none');

  let num1 = Math.floor(Math.random() * 5) + 1; 
  let num2 = Math.floor(Math.random() * 5) + 1; 
  let correctSum = num1 + num2; 
  
  let imageToUse = questionImages[Math.floor(Math.random() * questionImages.length)];
  
  document.getElementById('question').innerHTML = 
    `<span class="emoji-group">${imageToUse.repeat(num1)}</span>
     <span class="math-sign">+</span>
     <span class="emoji-group">${imageToUse.repeat(num2)}</span>`;
  
  let answerOptions = [correctSum]; 
  while (answerOptions.length < 4) {
    let wrongAnswer = Math.floor(Math.random() * 10) + 1;
    if (!answerOptions.includes(wrongAnswer)) {
      answerOptions.push(wrongAnswer);
    }
  }
  
  answerOptions.sort(() => Math.random() - 0.5); 
  correctAnswerIndex = answerOptions.indexOf(correctSum);
  
  for (let i = 0; i < 4; i++) {
    document.getElementById('board-' + i).innerText = answerOptions[i];
  }
}

function shootConfetti() {
  const container = document.getElementById('game-container');
  const emojis = ['🎉', '⭐', '🎈', '🍬', '🍉'];
  for (let i = 0; i < 30; i++) {
    let conf = document.createElement('div');
    conf.className = 'confetti';
    conf.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    conf.style.left = (Math.random() * 95) + '%';
    conf.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(conf);
  }
}

function showBooText(x, y) {
  const container = document.getElementById('game-container');
  let boo = document.createElement('div');
  boo.className = 'boo-text';
  boo.innerText = 'BOO!';
  boo.style.left = (x - 20) + 'px';
  boo.style.top = (y - 50) + 'px';
  container.appendChild(boo);
}

function chooseAnswer(selectedIndex) {
  if (isAnimating) return; 
  isAnimating = true;
  
  initAudio(); 

  const turtle = document.getElementById('turtle');
  const clickedBoard = document.getElementById('board-' + selectedIndex);
  
  turtle.classList.remove('idle-float');
  turtle.style.animation = 'none';
  playJumpSound();
  
  const boardRect = clickedBoard.getBoundingClientRect();
  const containerRect = document.getElementById('game-container').getBoundingClientRect();
  
  let targetX = (boardRect.left - containerRect.left) + (boardRect.width / 2) - 50; 
  let targetY = (boardRect.top - containerRect.top) - 95; 
  
  turtle.style.left = targetX + 'px';
  turtle.style.top = targetY + 'px';
  
  setTimeout(() => {
    // spring squashes when the turtle lands
    const spring = clickedBoard.nextElementSibling;
    spring.style.animation = 'pressSpring 0.4s ease-out';
    clickedBoard.style.animation = 'pressBoard 0.4s ease-out';

    if (selectedIndex === correctAnswerIndex) {
      
      playYaySound();
      rightCount++;
      document.getElementById('right-count').innerText = rightCount;

      turtle.style.animation = 'bounceJoy 0.4s infinite alternate ease-in-out';
      setTimeout(() => {
        clickedBoard.style.animation = 'bounceJoy 0.4s infinite alternate ease-in-out';
      }, 400);
      
      shootConfetti();
      
      setTimeout(() => {
        isAnimating = false;
        loadNextQuestion();
      }, 2000);

    } else {
      
      playBooSound();
      wrongCount++;
      document.getElementById('wrong-count').innerText = wrongCount;

      turtle.style.transition = 'none'; 
      clickedBoard.style.animation = 'snapBoard 0.4s ease-out forwards';
      turtle.style.animation = 'throwOff 1.2s forwards cubic-bezier(0.1, 0.8, 0.2, 1)';
      
      showBooText(targetX, targetY);
      
      setTimeout(() => {
        isAnimating = false;
        loadNextQuestion();
      }, 1500);
    }
  }, 500);
}

// Start on load
window.onload = loadNextQuestion;
