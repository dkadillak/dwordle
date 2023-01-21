/*
TO DO
- add better way to show what word was

GET https://words.dev-apis.com/word-of-the-day

POST https://words.dev-apis.com/validate-word
expects JSON with a property called "word"
*/

const board = document.querySelector('.tiles-layout').children;
const onScreenKeyboard = document.querySelector('.onscreen-keyboard');
let letterCount = 0;
let tileStartIndex = 0;
let tileEndIndex = 4; 

let puzzleWord = null;

const getWordUrl = "https://words.dev-apis.com/word-of-the-day?random=1"; 
const checkWordUrl = "https://words.dev-apis.com/validate-word";
const classColors = {
    "partial" : "guess-almost-correct",
    "incorrect" : "guess-incorrect",
    "correct" : "guess-correct"
}

//main flow
getWord(); // get word of the day that user will attempt to guess

startLetterInput(); // handle keyboard input from the user

startOnScreenKeyboardInput();

setBoard(); //make sure all tiles are set to default color
// end main flow


function keyDownHandler(event) {
   handleKeyPress(event.key);
}

function keyboardInputHandler(event) {
    switch(event.target.innerText) {

        case 'ENTER':
            handleKeyPress('Enter');
            break;

        case '←':
            handleKeyPress('Backspace');
            break;
        
        default:
            handleKeyPress(event.target.innerText);
    }
}

function startOnScreenKeyboardInput() {
    onScreenKeyboard.addEventListener("click", keyboardInputHandler);
}

function stopOnScreenKeyboardInput() {
    onScreenKeyboard.removeEventListener("click", keyboardInputHandler);
}

function getBoard() {
    return document.querySelector('.tiles-layout').children;
}


function setBoard() {
    for(let i=0; i<board.length; i++){
        board[i].classList += ' guess-none';
        }
}

function animateHeader() {
    document.querySelector('.header-text').className += ' animate';

}

function shakeRow() {
    for(let i = tileStartIndex; i<= tileEndIndex; i++){
        let classNameParts = board[i].className.split(' ');
        board[i].className = classNameParts[0] + ' ' + classNameParts[1] + " horizontal-shake";
    }
}

function removeShake() {
    for(let i = tileStartIndex; i<= tileEndIndex; i++){
        let classNameParts = board[i].className.split(' ');
        board[i].className = classNameParts[0] + ' ' + classNameParts[1];
    }
}

function removeLetter() {
    if (letterCount >= tileStartIndex) {
        board[letterCount].innerText = '';

        if (letterCount !== tileStartIndex){
            letterCount -= 1;
        }
    }
}

function addLetterToBoard(letter) {
    if (letterCount <= tileEndIndex){
        if (board[letterCount].innerText === ''){
            board[letterCount].innerText = letter;
        }
        else {
            if (board[letterCount].innerText !== ''){
                if (letterCount === tileEndIndex){
                    board[letterCount].innerText = letter;
                }
                else {
                    board[letterCount+1].innerText = letter;
                    letterCount += 1;
                }
            }
        }
    }
}


function stopLetterInput(){
    document.removeEventListener('keydown', keyDownHandler);
}

function startLetterInput(){
    document.addEventListener('keydown', keyDownHandler);
}

function gameOver(){
    document.querySelector('.word-answer').innerText = puzzleWord;
    stopLetterInput();
    stopOnScreenKeyboardInput();
}


function gameWon(){
    animateHeader();
    stopLetterInput();
    stopOnScreenKeyboardInput();
}


function getWordFromRow(){
    let word = '';
    for(let i = tileStartIndex; i <= tileEndIndex; i++){
        word += board[i].innerText;
    }
    return word;
}

/*
test cases
loyal
mayor

stove
votes
shush
*/
function checkPartialCorrect(userGuess, index){
    const guessLetter = userGuess[index];
    if (userGuess.substring(0,index).includes(guessLetter)){
        return false;
    } 

    if (puzzleWord.includes(guessLetter)) {
        // attempt to find the same letter but it was correct, in which case don't make tile yellow
        for(let i = index+1; i < puzzleWord.length; i++) {
            let boardTile = board[tileStartIndex + i];
            if(boardTile.innerText.toLowerCase() === guessLetter && boardTile.className.includes('guess-correct')){
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}


function checkUserGuess(userGuess){
    // assign correct tile coloring
    for(let i = 0; i < puzzleWord.length; i++){
        if ( puzzleWord[i] === userGuess[i]){
            addClassToTile(tileStartIndex + i, "correct");
        } else {
            addClassToTile(tileStartIndex + i, "incorrect");
        } 
        
    }

    // assign partial correct  tile coloring
    for(let i = 0; i < puzzleWord.length; i++){ 
        if(board[tileStartIndex + i].className.includes('guess-correct')) { 
            continue;
        }
        if (checkPartialCorrect(userGuess, i)) {
            addClassToTile(tileStartIndex + i, "partial");
        }
    }

    return puzzleWord === userGuess;
}


function addClassToTile(index, classColorsKey){
    board[index].className = board[index].className.split(' ')[0] + " " +  classColors[classColorsKey];
}


function validateRow(){
    let userGuess = getWordFromRow();
    if (letterCount === tileEndIndex){
        checkIsValidWord(userGuess).then((isValidWord) => {
            if (isValidWord) {
                if(checkUserGuess(userGuess.toLowerCase())){
                    gameWon();
                }
                else {
                    if (tileEndIndex == 29) {
                        gameOver()
                    }
                    tileStartIndex += 5;
                    tileEndIndex += 5;
                }
            }
            else{
                // not a word
                shakeRow();
            }
        });
        
    }
}


function handleKeyPress(key) {
    if (isLetter(key)){
        addLetterToBoard(key);
    } 
    else if (key === 'Backspace'){
        removeLetter();
    }
    else if (key === 'Enter'){
        //don't take any input from the user when validating letters
        stopLetterInput();
        stopOnScreenKeyboardInput();

        validateRow();

        //after row is validated, accept input from the user
        startLetterInput();

        startOnScreenKeyboardInput();

        //remove css class that does the shaking of a row
        removeShake();
    }
}


function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}


function getWord(){
 const promise = fetch(getWordUrl);
 promise
    .then(function (response) {
    const processingPromise = response.text();
    return processingPromise;
  })
    .then(function (processedResponse) {
    const wordObject = JSON.parse(processedResponse);
    puzzleWord = wordObject.word.toLowerCase();
  });
}


async function checkIsValidWord(userGuess){
    const promise = await fetch(checkWordUrl,{
        method: 'POST',
        body: JSON.stringify({
            'word': userGuess 
        }),
        headers: {
            'Content-Type': 'application/json'
          }
    });

    const respJson = await promise.json();

    return respJson.validWord;
}
