const challenges = [
    {
        prompt: "Move to the end of the line",
        solution: "$",
        hint: "Use '$' to move to the end of the line.",
        text: "This is a sample line of text.\nMove the cursor to the end of this line."
    },
    {
        prompt: "Move to the beginning of the file",
        solution: "gg",
        hint: "Use 'gg' to move to the first line of the file.",
        text: "This is the first line.\nThis is the second line.\nThis is the third line."
    },
    {
        prompt: "Delete a word",
        solution: "dw",
        hint: "Use 'dw' to delete from the cursor to the end of the word.",
        text: "Delete this word.\nLeave this line intact."
    },
    {
        prompt: "Change a word",
        solution: "cw",
        hint: "Use 'cw' to change from the cursor to the end of the word.",
        text: "Change this word.\nLeave this line intact."
    },
    {
        prompt: "Move down 3 lines",
        solution: "3j",
        hint: "Combine a number with 'j' to move down multiple lines.",
        text: "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
    }
];

let currentChallenge = 0;
let cursorPosition = { line: 1, column: 1 };
let vimState = {
    mode: "NORMAL",
    text: [],
    commandBuffer: ""
};

function loadChallenge() {
    const challenge = challenges[currentChallenge];
    document.getElementById("challenge-description").textContent = challenge.prompt;
    vimState.text = challenge.text.split('\n');
    updateTextContent();
    updateCursorPosition(1, 1);
    updateProgress();
}

function updateTextContent() {
    const textContent = document.getElementById("text-content");
    const lineNumbers = document.getElementById("line-numbers");
    textContent.innerHTML = vimState.text.map(line => `<div>${line}</div>`).join('');
    lineNumbers.innerHTML = vimState.text.map((_, i) => `<div>${i + 1}</div>`).join('');
}

function updateCursorPosition(line, column) {
    cursorPosition = { line, column };
    const cursor = document.getElementById("cursor");
    const textContent = document.getElementById("text-content");
    const lineHeight = parseFloat(getComputedStyle(textContent.firstChild).lineHeight);
    
    cursor.style.height = `${lineHeight}px`;
    cursor.style.top = `${(line - 1) * lineHeight + 16}px`; // 16px is the padding-top of vim-content
    cursor.style.left = `${(column - 1) * 9.6 + 48}px`; // 9.6px is the width of a character, 48px accounts for line numbers and padding
    
    document.getElementById("cursor-position").textContent = `${line}:${column}`;
}

function processCommand(command) {
    vimState.commandBuffer += command;
    
    if (vimState.commandBuffer === "i") {
        vimState.mode = "INSERT";
        updateMode();
        vimState.commandBuffer = "";
    } else if (vimState.mode === "INSERT" && command === "Escape") {
        vimState.mode = "NORMAL";
        updateMode();
        vimState.commandBuffer = "";
    } else if (vimState.mode === "NORMAL") {
        let match;
        if (match = vimState.commandBuffer.match(/^(\d*)([hjkl$])$/)) {
            const [_, count, motion] = match;
            const repeat = count ? parseInt(count) : 1;
            moveCursor(motion, repeat);
            vimState.commandBuffer = "";
        } else if (vimState.commandBuffer === "gg") {
            updateCursorPosition(1, 1);
            vimState.commandBuffer = "";
        } else if (vimState.commandBuffer === "G") {
            updateCursorPosition(vimState.text.length, 1);
            vimState.commandBuffer = "";
        } else if (vimState.commandBuffer === "dw") {
            deleteWord();
            vimState.commandBuffer = "";
        } else if (vimState.commandBuffer === "cw") {
            changeWord();
            vimState.commandBuffer = "";
        }
    }
    
    checkSolution(command);
}

function moveCursor(motion, repeat) {
    for (let i = 0; i < repeat; i++) {
        switch (motion) {
            case 'h':
                if (cursorPosition.column > 1) cursorPosition.column--;
                break;
            case 'j':
                if (cursorPosition.line < vimState.text.length) cursorPosition.line++;
                break;
            case 'k':
                if (cursorPosition.line > 1) cursorPosition.line--;
                break;
            case 'l':
                if (cursorPosition.column < vimState.text[cursorPosition.line - 1].length) cursorPosition.column++;
                break;
            case '$':
                cursorPosition.column = vimState.text[cursorPosition.line - 1].length;
                break;
        }
    }
    updateCursorPosition(cursorPosition.line, cursorPosition.column);
}

function deleteWord() {
    const line = vimState.text[cursorPosition.line - 1];
    const words = line.split(' ');
    const currentWordIndex = words.findIndex((word, index) => 
        index === words.length - 1 || 
        cursorPosition.column <= words.slice(0, index + 1).join(' ').length + index
    );
    words.splice(currentWordIndex, 1);
    vimState.text[cursorPosition.line - 1] = words.join(' ');
    updateTextContent();
}

function changeWord() {
    deleteWord();
    vimState.mode = "INSERT";
    updateMode();
}

function updateMode() {
    document.querySelector(".vim-mode").textContent = vimState.mode;
    document.getElementById("current-mode").textContent = vimState.mode;
}

function checkSolution(userInput) {
    const feedback = document.getElementById("feedback");
    const solution = challenges[currentChallenge].solution;

    if (userInput === solution) {
        feedback.textContent = "✅ Correct! Moving to the next challenge...";
        feedback.style.color = "var(--success-color)";
        currentChallenge++;

        if (currentChallenge < challenges.length) {
            setTimeout(loadChallenge, 1500);
        } else {
            feedback.textContent = "🎉 Congratulations! You've completed all challenges!";
        }
    } else {
        feedback.textContent = "❌ Incorrect. Try again!";
        feedback.style.color = "var(--error-color)";
    }
}

function updateProgress() {
    const progressText = document.getElementById("progress");
    const progressFill = document.getElementById("progress-fill");
    
    progressText.textContent = `${currentChallenge + 1}/${challenges.length}`;
    progressFill.style.width = `${((currentChallenge + 1) / challenges.length) * 100}%`;
}

function showHint() {
    const hint = document.getElementById("hint");
    hint.textContent = challenges[currentChallenge].hint;
}

function resetProgress() {
    currentChallenge = 0;
    loadChallenge();
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
}

document.getElementById("command-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        processCommand(event.target.value.trim());
        event.target.value = "";
    } else if (event.key === "Escape") {
        processCommand("Escape");
    } else {
        document.getElementById("typed-command").textContent = event.target.value;
    }
});

document.getElementById("hint-button").addEventListener("click", showHint);
document.getElementById("reset-progress").addEventListener("click", resetProgress);
document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

loadChallenge();

