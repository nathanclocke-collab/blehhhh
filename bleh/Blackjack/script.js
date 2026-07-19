// Game State variables
let deck = [];
let playerHand = [];
let dealerHand = [];
let playerScore = 0;
let dealerScore = 0;
let gameInProgress = false;

// DOM Elements
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const dealBtn = document.getElementById('deal-btn');
const playerCardsEl = document.getElementById('player-cards');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerScoreEl = document.getElementById('player-score');
const dealerScoreEl = document.getElementById('dealer-score');
const messageEl = document.getElementById('message-el');

// 1. Create a fresh deck of cards
function buildDeck() {
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♣', '♦', '♥', '♠'];
    let newDeck = [];

    for (let s = 0; s < suits.length; s++) {
        for (let v = 0; v < values.length; v++) {
            newDeck.push({ value: values[v], suit: suits[s] });
        }
    }
    return newDeck;
}

// 2. Shuffle the deck
function shuffleDeck(deckToShuffle) {
    for (let i = deckToShuffle.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = deckToShuffle[i];
        deckToShuffle[i] = deckToShuffle[j];
        deckToShuffle[j] = temp;
    }
    return deckToShuffle;
}

// 3. Calculate the score of a hand (Accounts for flexible Aces)
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;

    for (let card of hand) {
        if (card.value === 'A') {
            aceCount += 1;
            value += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    // Adjust for Aces if busting
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }

    return value;
}

// 4. Render a hand onto the webpage
function renderHand(hand, element) {
    element.innerHTML = '';
    hand.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.innerText = `${card.value}${card.suit}`;
        
        // Color hearts/diamonds red
        if (card.suit === '♥' || card.suit === '♦') {
            cardDiv.style.color = 'red';
        }
        element.appendChild(cardDiv);
    });
}

// 5. Update the UI scores and cards
function updateUI() {
    renderHand(playerHand, playerCardsEl);
    renderHand(dealerHand, dealerCardsEl);
    
    playerScore = calculateHandValue(playerHand);
    dealerScore = calculateHandValue(dealerHand);
    
    playerScoreEl.textContent = playerScore;
    dealerScoreEl.textContent = dealerScore;
}

// 6. Start a new game
function startGame() {
    deck = shuffleDeck(buildDeck());
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()]; // Simplification: showing both dealer cards for now
    
    gameInProgress = true;
    
    hitBtn.disabled = false;
    standBtn.disabled = false;
    dealBtn.disabled = true;
    messageEl.textContent = "Hit or Stand?";

    updateUI();

    // Check for natural Blackjack right away
    if (playerScore === 21) {
        endGame("Blackjack! You win!");
    }
}

// 7. Hit Functionality
function hit() {
    if (!gameInProgress) return;
    
    playerHand.push(deck.pop());
    updateUI();
    
    if (playerScore > 21) {
        endGame("You busted! Dealer wins.");
    }
}

// 8. Stand Functionality (Dealer plays)
function stand() {
    if (!gameInProgress) return;

    // Dealer rules: must hit until reaching 17 or higher
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    
    updateUI();
    
    const finalPlayer = playerScore;
    const finalDealer = dealerScore;

    if (finalDealer > 21) {
        endGame("Dealer busted! You win!");
    } else if (finalPlayer > finalDealer) {
        endGame("You win!");
    } else if (finalDealer > finalPlayer) {
        endGame("Dealer wins.");
    } else {
        endGame("It's a tie (Push)!");
    }
}

// 9. End Game state clean up
function endGame(message) {
    messageEl.textContent = message;
    gameInProgress = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    dealBtn.disabled = false;
}

// Event Listeners
dealBtn.addEventListener('click', startGame);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);