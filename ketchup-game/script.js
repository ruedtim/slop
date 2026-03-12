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
    let currentPourRate = 0.05; // Starting Amount per tick (starts very slow)
    let pourInterval;
    let gameEnded = false;
    let textSpawnCounter = 0;

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

    // Thresholds
    const minThreshold = 45;
    const maxThreshold = 60;
    const explosionThreshold = 100;

    function startPouring(e) {
        if (gameEnded) return;
        if (e.type === 'touchstart') e.preventDefault(); // Prevent double firing on mobile

        isPouring = true;
        currentPourRate = 0.05; // Reset pour rate
        
        pourBtn.classList.add('active');
        lukasImg.classList.add('pouring');
        ketchupStream.classList.add('active');

        pourInterval = setInterval(() => {
            if (isPouring) {
                // Accelerate the pour rate exponentially!
                currentPourRate *= 1.05;
                ketchupAmount += currentPourRate;
                
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
        
        // Add a chaotic glitch effect to the meter to make it harder to read near the explosion limit
        if (ketchupAmount > 30) {
            const jitterAmount = Math.min(10, ketchupAmount / 8); 
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
            resultOverlay.classList.add('result-bland');
            resultTitle.textContent = 'Viel zu fad!';
            resultText.textContent = `Nur ${amountDisplay}% Ketchup? Das schmeckt nach nichts. Da muss mehr Heinz rein!`;
            ratingStars.textContent = '★☆☆';
            ratingStars.style.color = 'var(--text-muted)';
        } else if (amountDisplay <= maxThreshold) {
            // Perfect
            resultOverlay.classList.add('result-perfect');
            resultTitle.textContent = 'Perfekte Suppe!';
            resultText.textContent = `Genau richtig! ${amountDisplay}% Ketchup ist die perfekte Balance. Lukas ist stolz auf dich.`;
            ratingStars.textContent = '★★★';
            ratingStars.style.color = 'var(--gold)';
            
            // Trigger confetti or something here if we had a library
        } else if (amountDisplay < explosionThreshold) {
            // Too sweet
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
        currentPourRate = 0.05;
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
