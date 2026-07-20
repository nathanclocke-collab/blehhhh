// --- Bangle.js 3-Card Interval Flashcard App ---
const Storage = require("Storage");
const FILE_NAME = "flashcards.json";

let deck = [
  { f: "Multisensory Integration", b: "Combining different sensory modalities (e.g., visual + auditory) into a unified perception." },
  { f: "F# to A#", b: "4 half steps (Major 3rd)" },
  { f: "Plain English Rule", b: "Remove jargon, eliminate passive voice, and discard personification." },
  { f: "ASL: Puppy", b: "Snap fingers twice or mimic petting a dog near your hip." },
  { f: "Blackjack Strategy", b: "Always hit on a hard 11 or lower, stand on hard 17 or higher." }
];

// Persistent session tracking
let currentIndex = 0; // Index of the card currently on screen
let cardsSolvedThisSession = 0; // Strict counter up to 3
let isFlipped = false;

function loadDeck() {
  let saved = Storage.readJSON(FILE_NAME, 1);
  if (saved && saved.length > 0) {
    deck = saved;
  }
}

function saveDeck() {
  Storage.writeJSON(FILE_NAME, deck);
}

function drawCardText(text) {
  let maxWidth = g.getWidth() - 16;
  let maxHeight = isFlipped ? g.getHeight() - 110 : g.getHeight() - 60;
  let fontSize = 24;
  let lines = [];
  
  do {
    g.setFont("Vector", fontSize);
    lines = g.wrapString(text, maxWidth);
    let totalHeight = lines.length * (fontSize + 4);
    if (totalHeight <= maxHeight || fontSize <= 12) break;
    fontSize -= 2;
  } while (fontSize > 12);

  g.setColor("#ffffff");
  g.setFontAlign(0, 0);
  
  let yCenter = 24 + (maxHeight / 2);
  let lineHeight = fontSize + 4;
  let yStart = yCenter - ((lines.length - 1) * lineHeight) / 2;
  
  for (let i = 0; i < lines.length; i++) {
    g.drawString(lines[i], g.getWidth() / 2, yStart + (i * lineHeight));
  }
}

function drawCard() {
  g.clear();
  
  // 1. Top Status Bar showing progression out of 3
  g.setBgColor("#111111");
  g.clearRect(0, 0, g.getWidth(), 24);
  g.setColor("#ffffff");
  g.setFont("6x8", 1);
  g.setFontAlign(-1, -1);
  g.drawString(" Progress: " + (cardsSolvedThisSession + 1) + "/3", 6, 8);
  
  // 2. Card Body
  let card = deck[currentIndex];
  g.setBgColor(isFlipped ? "#151c28" : "#241818"); 
  g.clearRect(0, 24, g.getWidth(), g.getHeight());
  
  drawCardText(isFlipped ? card.b : card.f);
  
  // 3. UI Buttons
  let btnY = g.getHeight() - 45;
  let btnHeight = 40;
  
  if (isFlipped) {
    let btnWidth = (g.getWidth() - 16) / 3;
    
    // AGAIN
    g.setColor("#ff4d4d");
    g.fillRect(4, btnY, 4 + btnWidth, btnY + btnHeight);
    g.setColor("#ffffff");
    g.setFont("6x8", 1); g.setFontAlign(0, 0);
    g.drawString("AGAIN", 4 + btnWidth/2, btnY + btnHeight/2);
    
    // GOOD
    g.setColor("#4da6ff");
    g.fillRect(8 + btnWidth, btnY, 8 + (btnWidth * 2), btnY + btnHeight);
    g.setColor("#ffffff");
    g.drawString("GOOD", 8 + (btnWidth * 1.5), btnY + btnHeight/2);
    
    // EASY
    g.setColor("#5cd65c");
    g.fillRect(12 + (btnWidth * 2), btnY, g.getWidth() - 4, btnY + btnHeight);
    g.setColor("#000000");
    g.drawString("EASY", 12 + (btnWidth * 2.5), btnY + btnHeight/2);
  } else {
    g.setColor("#333333");
    g.fillRect(10, btnY, g.getWidth() - 10, btnY + btnHeight);
    g.setColor("#aaaaaa");
    g.setFont("6x8", 1); g.setFontAlign(0, 0);
    g.drawString("TAP TO REVEAL", g.getWidth() / 2, btnY + btnHeight / 2);
  }
}

function handleScore(quality) {
  // Pull the current card out
  let card = deck.splice(currentIndex, 1)[0]; 
  
  // Reposition card in deck based on answer quality
  if (quality === "again") {
    deck.splice(currentIndex + 1, 0, card); // Next batch soon
  } else if (quality === "good") {
    let target = Math.min(deck.length, currentIndex + 5);
    deck.splice(target, 0, card);
  } else if (quality === "easy") {
    deck.push(card); // Back of the queue
  }
  
  saveDeck(); // Keep deck changes synced to storage
  
  cardsSolvedThisSession++;
  
  // Check if session limits are hit
  if (cardsSolvedThisSession >= 3) {
    exitToClockWithTimer();
  } else {
    // If we haven't hit 3 yet, loop safely back within index bounds
    if (currentIndex >= deck.length) currentIndex = 0;
    isFlipped = false;
    drawCard();
  }
}

function exitToClockWithTimer() {
  g.clear();
  g.setFont("6x8", 2);
  g.setColor("#ffffff");
  g.setFontAlign(0, 0);
  g.drawString("Session Done!\nSee you in 5m.", g.getWidth()/2, g.getHeight()/2);
  
  // Schedule a wake-up alarm event using Espruino global layout 5 minutes from now (5 * 60 * 1000)
  // This writes a system wake option and drops out to the default clock face
  setTimeout(function() {
    // This executes background side scripts to load back into our app explicitly
    load("flashcards.app.js");
  }, 300000); 

  // Wait 2 seconds so they can read the text, then load the default system clock
  setTimeout(function() {
    load(); // Empty load clears current binary context execution back to default clock face
  }, 2000);
}

// Global Touch Setup
Bangle.on("touch", function(button, xy) {
  let btnY = g.getHeight() - 45;
  if (!isFlipped) {
    isFlipped = true;
    drawCard();
  } else {
    if (xy.y >= btnY) {
      let edgeWidth = g.getWidth() / 3;
      if (xy.x < edgeWidth) {
        handleScore("again");
      } else if (xy.x > edgeWidth * 2) {
        handleScore("easy");
      } else {
        handleScore("good");
      }
    }
  }
});

// App Startup Routine
loadDeck();
// Buzz the hardware immediately on launch to alert the user that a new session has popped up
Bangle.buzz(500); 
drawCard();