document.addEventListener('DOMContentLoaded', () => {
    const pourBtn = document.getElementById('pourBtn');
    const lukasImg = document.getElementById('lukas');
    const ketchupStream = document.getElementById('ketchupStream');
    const ketchupMeter = document.getElementById('ketchupMeter');
    
    // Funny New Elements
    const gameScene = document.getElementById('gameScene');
    const imageWrapper = document.getElementById('imageWrapper');
    const funnyTextContainer = document.getElementById('funnyTextContainer');
    const bloodyScreen = document.getElementById('bloodyScreen');
    
    const resultOverlay = document.getElementById('resultOverlay');
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');
    const ratingStars = document.getElementById('ratingStars');
    const retryBtn = document.getElementById('retryBtn');
    
    // Game variables
    let isPouring = false;
    let ketchupAmount = 0;
    const maxAmount = 150; // allow overflowing to 150% for explosion
    let currentPourRate = 0.05; // Starting Amount per tick
    let pourInterval;
    let gameEnded = false;
    let textSpawnCounter = 0;

    // AUDIO SYSTEM
    let audioCtx;
    let pourOscillator;
    let pourGain;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playGluckSound() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const mod = audioCtx.createOscillator(); // FM Modulator for crazy sounds
        const modGain = audioCtx.createGain();
        const gain = audioCtx.createGain();
        
        // Crazy routing: Modulator -> ModGain -> Osc.Frequency -> Gain -> Out
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // "Oink goink" type sounds: Rapid pitch sweeps with FM synthesis
        osc.type = Math.random() > 0.5 ? 'sawtooth' : 'sine';
        mod.type = 'square';
        
        // Base frequency jumps around like crazy
        const baseFreq = 100 + Math.random() * 800;
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * (Math.random() > 0.5 ? 2 : 0.5), audioCtx.currentTime + 0.15);
        
        // Modulation depth is extreme
        mod.frequency.value = 5 + Math.random() * 50; 
        modGain.gain.value = 500 + Math.random() * 1000;
        
        // Envelope: short, harsh honk/squeak
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        osc.start();
        mod.start();
        osc.stop(audioCtx.currentTime + 0.15);
        mod.stop(audioCtx.currentTime + 0.15);
    }

    function startPourSound() {
        initAudio();
    }

    function stopPourSound() {
        // Just rely on the interval stopping the gluck sounds
    }

    function playExplosionSound() {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // White noise
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        
        // Lowpass filter for explosion crunch
        const filter = audioCtx.createBiquadFilter();
        // A resonant sweeping filter for a laser-fart explosion
        filter.type = 'bandpass';
        filter.Q.value = 10;
        filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 2.0);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(3, audioCtx.currentTime); // LOUD
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);
        
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Also add a massive sub-bass drop
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 2.0);
        oscGain.gain.setValueAtTime(2, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);

        noiseSource.start();
        osc.start();
        noiseSource.stop(audioCtx.currentTime + 2.0);
        osc.stop(audioCtx.currentTime + 2.0);
    }

    function playWinSound() {
        if (!audioCtx) return;
        // Hyperactive manic arpeggio
        const noteFreqs = [440, 554, 659, 880, 1108, 1318, 1760]; 
        for(let i=0; i<20; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            osc.frequency.value = noteFreqs[Math.floor(Math.random() * noteFreqs.length)];
            
            const startTime = audioCtx.currentTime + (i * 0.05);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        }
    }

    function playFailSound() {
        if (!audioCtx) return;
        // Horrible dissonant "waaaaaah" sound
        const freqs = [150, 155, 145]; // Beating frequencies
        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sawtooth';
            
            osc.frequency.setValueAtTime(freq * 3, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq, audioCtx.currentTime + 1.5);
            
            // Wobbly volume
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
            gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.5, 0.5);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 2);
        });
    }

    const funnyTexts = [
        "Mehr!", 
        "HEINZ wäre stolz!", 
        "Ist das noch Suppe?", 
        "Lukas liebt Ketchup!", 
        "KEEEEETCHUP!", 
        "Die Tomaten weinen!",
        "Gib ihm!",
        "Raus damit!",
        "Gluck gluck gluck..."
    ];

    // Thresholds - BRUTALLY DIFFICULT
    const minThreshold = 50;
    const maxThreshold = 54; // Doubled window (4% instead of 2%)
    const explosionThreshold = 100;

    function startPouring(e) {
        if (gameEnded) return;
        if (e.type === 'touchstart') e.preventDefault(); // Prevent double firing on mobile

        initAudio(); // Required by browsers to start audio context on user interaction
        isPouring = true;
        currentPourRate = 0.01; // Start slow but accelerate INSANELY fast
        
        pourBtn.classList.add('active');
        lukasImg.classList.add('pouring');
        ketchupStream.classList.add('active');
        startPourSound();
        
        let gluckCounter = 0;

        pourInterval = setInterval(() => {
            if (isPouring) {
                // Accelerate the pour rate exponentially AND rapidly!
                currentPourRate *= 1.15; // 15% increase per tick (insanely fast)
                ketchupAmount += currentPourRate;
                
                // Play chaotic sounds based on amount and rate
                gluckCounter += currentPourRate;
                if (gluckCounter > (Math.random() * 3 + 1)) {
                    playGluckSound();
                    gluckCounter = 0;
                }
                
                updateEffects();
                
                if (ketchupAmount > 30) {
                    textSpawnCounter++;
                    if (textSpawnCounter > Math.max(5, 50 - ketchupAmount/2)) { // Spawn faster as amount increases
                        spawnFunnyText();
                        textSpawnCounter = 0;
                    }
                }

                // Explosion!
                if (ketchupAmount >= explosionThreshold) {
                    stopPouring(); 
                    triggerExplosion();
                } else {
                    updateMeter();
                }
            }
        }, 16); // roughly 60fps
    }

    function spawnFunnyText() {
        const textEx = document.createElement('div');
        textEx.className = 'funny-text';
        textEx.textContent = funnyTexts[Math.floor(Math.random() * funnyTexts.length)];
        
        // Random position
        const x = Math.random() * 80 + 10; // 10% to 90%
        const y = Math.random() * 60 + 20; // 20% to 80%
        
        textEx.style.left = `${x}%`;
        textEx.style.top = `${y}%`;
        
        funnyTextContainer.appendChild(textEx);
        
        // Remove after animation
        setTimeout(() => {
            if (funnyTextContainer.contains(textEx)) {
                funnyTextContainer.removeChild(textEx);
            }
        }, 1000);
    }
    
    function updateEffects() {
        // Remove all shakes first
        gameScene.classList.remove('shake-light', 'shake-medium', 'shake-heavy', 'shake-extreme');
        
        if (ketchupAmount > 90) {
            gameScene.classList.add('shake-extreme');
        } else if (ketchupAmount > 70) {
            gameScene.classList.add('shake-heavy');
        } else if (ketchupAmount > 50) {
            gameScene.classList.add('shake-medium');
        } else if (ketchupAmount > 30) {
            gameScene.classList.add('shake-light');
        }

        // Dynamic Zoom (starting from scale 1.02 to 1.5)
        const zoomLevel = 1.02 + (ketchupAmount / 150) * 0.48;
        lukasImg.style.transform = `scale(${zoomLevel})`;

        // Dynamic Color Overlay (0 to 0.7 opacity)
        const redOpacity = Math.min(0.7, (ketchupAmount / 100) * 0.7);
        // Using pseudo element is tricky via JS, so let's set a CSS var or modify wrapper background
        imageWrapper.style.backgroundColor = `rgba(255, 0, 0, ${redOpacity})`;
        lukasImg.style.mixBlendMode = ketchupAmount > 50 ? 'multiply' : 'normal';
    }

    function triggerExplosion() {
        if (gameEnded) return;
        gameEnded = true;
        
        playExplosionSound();
        
        bloodyScreen.classList.remove('hidden');
        bloodyScreen.classList.add('active');
        gameScene.classList.add('shake-extreme');

        setTimeout(() => {
            evaluateResult();
        }, 1500); // Dramatic pause
    }

    function stopPouring() {
        if (!isPouring || gameEnded) return;

        isPouring = false;
        clearInterval(pourInterval);
        stopPourSound();
        
        pourBtn.classList.remove('active');
        lukasImg.classList.remove('pouring');
        ketchupStream.classList.remove('active');

        // Evaluate result after a tiny delay for better UX
        setTimeout(evaluateResult, 500);
        gameEnded = true;
    }

    function updateMeter() {
        const cappedAmount = Math.min(ketchupAmount, 100);
        ketchupMeter.style.width = `${cappedAmount}%`;
        
        // Add a chaotic glitch effect to the meter to make it extremely hard to read
        if (ketchupAmount > 10) {
            const jitterAmount = Math.min(50, ketchupAmount); 
            const jitterX = (Math.random() * jitterAmount) - (jitterAmount/2);
            ketchupMeter.style.transform = `translateX(${jitterX}px)`;
        } else {
            ketchupMeter.style.transform = `translateX(0)`;
        }
        
        // Change color based on amount (optional extra polish)
        if (ketchupAmount > maxThreshold) {
            ketchupMeter.style.background = 'linear-gradient(90deg, #800000 0%, #ff0000 100%)';
            ketchupMeter.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
        } else if (ketchupAmount >= minThreshold) {
            ketchupMeter.style.background = 'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)';
            ketchupMeter.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.6)';
        } else {
            ketchupMeter.style.background = 'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)';
            ketchupMeter.style.boxShadow = '0 0 10px rgba(255, 152, 0, 0.4)';
        }
    }

    function evaluateResult() {
        resultOverlay.classList.remove('hidden');
        resultOverlay.className = 'result-overlay'; // Reset classes
        
        const amountDisplay = Math.round(ketchupAmount);
        
        if (amountDisplay < minThreshold) {
            // Too little
            playFailSound();
            resultOverlay.classList.add('result-bland');
            resultTitle.textContent = 'Viel zu fad!';
            resultText.textContent = `Nur ${amountDisplay}% Ketchup? Das schmeckt nach nichts. Da muss mehr Heinz rein!`;
            ratingStars.textContent = '★☆☆';
            ratingStars.style.color = 'var(--text-muted)';
        } else if (amountDisplay <= maxThreshold) {
            // Perfect
            playWinSound();
            resultOverlay.classList.add('result-perfect');
            resultTitle.textContent = 'Perfekte Suppe!';
            resultText.textContent = `Genau richtig! ${amountDisplay}% Ketchup ist die perfekte Balance. Lukas ist stolz auf dich.`;
            ratingStars.textContent = '★★★';
            ratingStars.style.color = 'var(--gold)';
            
            // Trigger confetti or something here if we had a library
        } else if (amountDisplay < explosionThreshold) {
            // Too sweet
            playFailSound();
            resultOverlay.classList.add('result-sweet');
            resultTitle.textContent = 'Leider versaut!';
            resultText.textContent = `${amountDisplay}% Ketchup? Das ist keine Suppe mehr, das ist Ketchup pur! Viel zu süß.`;
            ratingStars.textContent = '☆☆☆';
            ratingStars.style.color = 'var(--primary-red)';
        } else {
            // EXPLOSION
            resultOverlay.classList.add('result-sweet');
            resultTitle.innerHTML = 'KATASTROPHE!!! <br> KETCHUP-EXPLOSION!';
            resultTitle.style.fontSize = '3.5rem';
            resultTitle.style.color = 'black';
            resultTitle.style.textShadow = '0 0 10px white';
            resultText.textContent = `Du hast das Universum in Tomatenmark verwandelt. Mamma Mia!`;
            resultText.style.color = 'black';
            
            resultModal = document.querySelector('.result-modal');
            resultModal.style.backgroundColor = 'var(--primary-red)';
            resultModal.style.boxShadow = '0 0 50px black';
            
            ratingStars.textContent = '💀💀💀';
            ratingStars.style.color = 'black';
        }
    }

    function resetGame() {
        gameEnded = false;
        ketchupAmount = 0;
        currentPourRate = 0.01;
        textSpawnCounter = 0;
        
        ketchupMeter.style.transform = 'translateX(0)';
        updateMeter();
        updateEffects(); // Reset visual effects
        
        funnyTextContainer.innerHTML = ''; // clear floating texts
        
        resultOverlay.classList.add('hidden');
        bloodyScreen.classList.add('hidden');
        bloodyScreen.classList.remove('active');
        gameScene.classList.remove('shake-extreme');
        lukasImg.style.transform = 'scale(1)';
        lukasImg.style.mixBlendMode = 'normal';
        imageWrapper.style.backgroundColor = 'black';
        
        // Reset modal styles if explosion happened
        const resultModal = document.querySelector('.result-modal');
        resultTitle.style.fontSize = '';
        resultTitle.style.color = '';
        resultTitle.style.textShadow = '';
        resultText.style.color = '';
        resultModal.style.backgroundColor = '';
        resultModal.style.boxShadow = '';
        
        // Reset meter visual
        ketchupMeter.style.background = 'linear-gradient(90deg, #ff9800 0%, var(--primary-red) 50%, #800000 100%)';
        ketchupMeter.style.boxShadow = '0 0 10px rgba(227, 24, 55, 0.5)';
    }

    // Event Listeners for the button
    pourBtn.addEventListener('mousedown', startPouring);
    pourBtn.addEventListener('mouseup', stopPouring);
    pourBtn.addEventListener('mouseleave', stopPouring);

    // Touch support
    pourBtn.addEventListener('touchstart', startPouring);
    pourBtn.addEventListener('touchend', stopPouring);
    pourBtn.addEventListener('touchcancel', stopPouring);

    retryBtn.addEventListener('click', resetGame);
});
