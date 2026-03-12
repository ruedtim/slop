document.addEventListener('DOMContentLoaded', () => {
    const pourBtn = document.getElementById('pourBtn');
    const lukasImg = document.getElementById('lukas');
    const ketchupStream = document.getElementById('ketchupStream');
    const ketchupMeter = document.getElementById('ketchupMeter');
    
    const resultOverlay = document.getElementById('resultOverlay');
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');
    const ratingStars = document.getElementById('ratingStars');
    const retryBtn = document.getElementById('retryBtn');
    
    // Game variables
    let isPouring = false;
    let ketchupAmount = 0;
    const maxAmount = 100; // 100%
    const pourRate = 0.5; // Amount per tick
    let pourInterval;
    let gameEnded = false;

    // Thresholds
    const minThreshold = 30;
    const maxThreshold = 65;

    function startPouring(e) {
        if (gameEnded) return;
        if (e.type === 'touchstart') e.preventDefault(); // Prevent double firing on mobile

        isPouring = true;
        pourBtn.classList.add('active');
        lukasImg.classList.add('pouring');
        ketchupStream.classList.add('active');

        pourInterval = setInterval(() => {
            if (isPouring) {
                ketchupAmount += pourRate;
                
                // Cap at 100%
                if (ketchupAmount >= maxAmount) {
                    ketchupAmount = maxAmount;
                    stopPouring(); // Forced stop if it reached max
                }
                
                updateMeter();
            }
        }, 16); // roughly 60fps
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
        ketchupMeter.style.width = `${ketchupAmount}%`;
        
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
        } else {
            // Too sweet
            resultOverlay.classList.add('result-sweet');
            resultTitle.textContent = 'Leider versaut!';
            resultText.textContent = `${amountDisplay}% Ketchup? Das ist keine Suppe mehr, das ist Ketchup pur! Viel zu süß.`;
            ratingStars.textContent = '☆☆☆';
            ratingStars.style.color = 'var(--primary-red)';
        }
    }

    function resetGame() {
        gameEnded = false;
        ketchupAmount = 0;
        updateMeter();
        resultOverlay.classList.add('hidden');
        
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
