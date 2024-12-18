<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	
	let text = "Welcome to the Vim Practice App!\nTry some commands below.\nUse 'i' to enter insert mode.\nUse 'esc' to exit insert mode.\nUse 'h', 'j', 'k', 'l' for movement.";
	let lines = text.split('\n');
	let cursor = { line: 0, col: 0 };
	let mode = 'normal';
	let command = '';
	let message = '';
	let history = [];
	let historyIndex = -1;
	
	let practiceMode = 'free';
	const practiceModes = ['free', 'movement', 'editing', 'search'];
	
	let challengeText = '';
	let challengeStartTime = null;
	let challengeEndTime = null;
	let challengeCompleted = false;
	let movementTarget = { line: 0, col: 0 };
	
	function handleKeydown(event) {
	  if (mode === 'normal') {
		handleNormalMode(event);
	  } else if (mode === 'insert') {
		handleInsertMode(event);
	  }
	  event.preventDefault();
	}
	
	function handleNormalMode(event) {
	  switch (event.key) {
		case 'h':
		  moveCursor(-1, 0);
		  break;
		case 'j':
		  moveCursor(0, 1);
		  break;
		case 'k':
		  moveCursor(0, -1);
		  break;
		case 'l':
		  moveCursor(1, 0);
		  break;
		case 'i':
		  mode = 'insert';
		  message = 'Insert mode';
		  break;
		case ':':
		  mode = 'command';
		  command = ':';
		  break;
		case '/':
		  mode = 'search';
		  command = '/';
		  break;
		case 'x':
		  deleteCharacter();
		  break;
	  }
	}
	
	function handleInsertMode(event) {
	  if (event.key === 'Escape') {
		mode = 'normal';
		message = 'Normal mode';
	  } else if (event.key === 'Backspace') {
		backspace();
	  } else if (event.key === 'Enter') {
		newLine();
	  } else if (event.key.length === 1) {
		insertCharacter(event.key);
	  }
	}
	
	function moveCursor(deltaX, deltaY) {
	  cursor.col = Math.max(0, Math.min(cursor.col + deltaX, lines[cursor.line].length));
	  cursor.line = Math.max(0, Math.min(cursor.line + deltaY, lines.length - 1));
	  cursor.col = Math.min(cursor.col, lines[cursor.line].length);
	  checkChallenge();
	}
	
	function deleteCharacter() {
	  if (cursor.col < lines[cursor.line].length) {
		lines[cursor.line] = lines[cursor.line].slice(0, cursor.col) + lines[cursor.line].slice(cursor.col + 1);
		lines = [...lines];
	  } else if (cursor.line < lines.length - 1) {
		lines[cursor.line] += lines[cursor.line + 1];
		lines.splice(cursor.line + 1, 1);
		lines = [...lines];
	  }
	  checkChallenge();
	}
	
	function backspace() {
	  if (cursor.col > 0) {
		lines[cursor.line] = lines[cursor.line].slice(0, cursor.col - 1) + lines[cursor.line].slice(cursor.col);
		moveCursor(-1, 0);
	  } else if (cursor.line > 0) {
		const previousLine = lines[cursor.line - 1];
		lines[cursor.line - 1] = previousLine + lines[cursor.line];
		lines.splice(cursor.line, 1);
		cursor.line--;
		cursor.col = previousLine.length;
	  }
	  lines = [...lines];
	  checkChallenge();
	}
	
	function newLine() {
	  const currentLine = lines[cursor.line];
	  lines = [
		...lines.slice(0, cursor.line),
		currentLine.slice(0, cursor.col),
		currentLine.slice(cursor.col),
		...lines.slice(cursor.line + 1)
	  ];
	  cursor.line++;
	  cursor.col = 0;
	  checkChallenge();
	}
	
	function insertCharacter(char) {
	  const currentLine = lines[cursor.line];
	  lines[cursor.line] = currentLine.slice(0, cursor.col) + char + currentLine.slice(cursor.col);
	  moveCursor(1, 0);
	  lines = [...lines];
	  checkChallenge();
	}
	
	function handleCommand() {
	  history.push(command);
	  historyIndex = history.length;
	  
	  if (command.startsWith(':w')) {
		message = 'File saved (simulated)';
	  } else if (command.startsWith(':q')) {
		message = 'Quit (simulated)';
	  } else {
		message = `Unknown command: ${command}`;
	  }
	  
	  command = '';
	  mode = 'normal';
	}
	
	function handleSearch() {
	  const searchTerm = command.slice(1);
	  let found = false;
	  for (let i = cursor.line; i < lines.length; i++) {
		const index = lines[i].indexOf(searchTerm, i === cursor.line ? cursor.col + 1 : 0);
		if (index !== -1) {
		  cursor.line = i;
		  cursor.col = index;
		  found = true;
		  break;
		}
	  }
	  message = found ? `Found '${searchTerm}'` : `'${searchTerm}' not found`;
	  command = '';
	  mode = 'normal';
	  checkChallenge();
	}
	
	function startChallenge() {
	  challengeCompleted = false;
	  switch (practiceMode) {
		case 'movement':
		  challengeText = 'Navigate to the highlighted position using h, j, k, l keys.';
		  cursor = { line: 0, col: 0 };
		  movementTarget = {
			line: Math.floor(Math.random() * 5),
			col: Math.floor(Math.random() * 30)
		  };
		  lines = Array(5).fill('').map(() => ' '.repeat(30));
		  break;
		case 'editing':
		  challengeText = 'Delete the word "DELETEME" using "x" key in normal mode.';
		  cursor = { line: 0, col: 0 };
		  lines = ['Delete the DELETEME word in this sentence.'];
		  break;
		case 'search':
		  challengeText = 'Search for the word "target" using "/target" in normal mode.';
		  cursor = { line: 0, col: 0 };
		  lines = [
			'This is a sample text.',
			'The word you\'re looking for is not here.',
			'But here\'s your target hidden in this line.',
			'Can you find it using Vim search?'
		  ];
		  break;
		default:
		  challengeText = 'Free practice mode. Try out various Vim commands!';
		  lines = text.split('\n');
	  }
	  challengeStartTime = Date.now();
	  challengeEndTime = null;
	}
	
	function checkChallenge() {
	  if (challengeCompleted) return;
	
	  let completed = false;
	  switch (practiceMode) {
		case 'movement':
		  completed = cursor.line === movementTarget.line && cursor.col === movementTarget.col;
		  break;
		case 'editing':
		  completed = !lines.join('\n').includes('DELETEME');
		  break;
		case 'search':
		  completed = cursor.line === 2 && cursor.col === lines[2].indexOf('target');
		  break;
	  }
	  if (completed) {
		challengeEndTime = Date.now();
		const duration = (challengeEndTime - challengeStartTime) / 1000;
		message = `Challenge completed in ${duration.toFixed(2)} seconds!`;
		challengeCompleted = true;
	  }
	}
	
	onMount(() => {
	  window.addEventListener('keydown', handleKeydown);
	  return () => {
		window.removeEventListener('keydown', handleKeydown);
	  };
	});
	</script>
	
	<main>
	  <div class="app-container">
		<div class="sidebar">
		  <h1>Vim Practice App</h1>
		  <div class="practice-mode">
			<h3>Practice Mode</h3>
			<select bind:value={practiceMode}>
			  {#each practiceModes as mode}
				<option value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
			  {/each}
			</select>
			<button on:click={startChallenge}>Start Challenge</button>
		  </div>
		  <div class="instructions">
			<h3>Instructions</h3>
			<ul>
			  <li><strong>i</strong>: Enter insert mode</li>
			  <li><strong>Esc</strong>: Exit insert mode</li>
			  <li><strong>h, j, k, l</strong>: Move cursor</li>
			  <li><strong>x</strong>: Delete character</li>
			  <li><strong>:</strong>: Enter command mode</li>
			  <li><strong>/</strong>: Enter search mode</li>
			</ul>
		  </div>
		  <div class="challenge-info">
			<h3>Current Challenge</h3>
			<p>{challengeText}</p>
		  </div>
		</div>
		<div class="editor-container">
		  <div class="text-editor">
			<div class="text-area">
			  {#each lines as line, i}
				<div class="line">
				  <span class="line-number">{i + 1}</span>
				  <span class="line-content">
					{#each line.split('') as char, j}
					  <span 
						class:cursor={i === cursor.line && j === cursor.col}
						class:target={practiceMode === 'movement' && i === movementTarget.line && j === movementTarget.col}
					  >
						{char === ' ' ? '\u00A0' : char}
					  </span>
					{/each}
					{#if i === cursor.line && cursor.col === line.length}
					  <span class="cursor"></span>
					{/if}
				  </span>
				</div>
			  {/each}
			</div>
		  </div>
		  <div class="status-bar">
			<span class="mode" class:insert={mode === 'insert'} class:command={mode === 'command' || mode === 'search'}>
			  {mode.toUpperCase()} MODE
			</span>
			<span class="position">Line: {cursor.line + 1}, Column: {cursor.col + 1}</span>
		  </div>
		  <div class="command-line">
			{#if mode === 'command' || mode === 'search'}
			  <input
				bind:value={command}
				placeholder={mode === 'command' ? 'Enter command...' : 'Search...'}
				on:keydown={(e) => {
				  if (e.key === 'Enter') {
					if (mode === 'command') handleCommand();
					else if (mode === 'search') handleSearch();
				  } else if (e.key === 'Escape') {
					command = '';
					mode = 'normal';
				  } else if (e.key === 'ArrowUp') {
					if (historyIndex > 0) {
					  historyIndex--;
					  command = history[historyIndex];
					}
				  } else if (e.key === 'ArrowDown') {
					if (historyIndex < history.length - 1) {
					  historyIndex++;
					  command = history[historyIndex];
					} else {
					  historyIndex = history.length;
					  command = '';
					}
				  }
				  e.stopPropagation();
				}}
			  />
			{:else}
			  <span>{message}</span>
			{/if}
		  </div>
		</div>
	  </div>
	</main>
	
	<style>

		@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');

	  :global(body) {
		background-color: #1e1e1e;
		color: #d4d4d4;
		font-family: 'Inter', 'Courier New', monospace;
		margin: 0;
		padding: 0;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	  }
	
	  main {
		width: 100%;
		max-width: 1200px;
		height: 90vh;
		display: flex;
		flex-direction: column;
	  }
	
	  .app-container {
		display: flex;
		background-color: #252526;
		border-radius: 6px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		flex-grow: 1;
	  }
	
	  .sidebar {
		width: 250px;
		background-color: #333333;
		padding: 20px;
		display: flex;
		flex-direction: column;
	  }
	
	  h1 {
		color: #ffffff;
		font-size: 1.5em;
		margin-bottom: 20px;
	  }
	
	  .practice-mode, .instructions, .challenge-info {
		background-color: #2d2d2d;
		padding: 15px;
		border-radius: 5px;
		margin-bottom: 20px;
	  }
	
	  h3 {
		margin-top: 0;
		color: #cccccc;
	  }
	
	  select, button {
		width: 100%;
		padding: 8px;
		margin-top: 10px;
		background-color: #3c3c3c;
		color: #ffffff;
		border: 1px solid #555555;
		border-radius: 4px;
	  }
	
	  button {
		background-color: #0e639c;
		cursor: pointer;
		transition: background-color 0.3s;
	  }
	
	  button:hover {
		background-color: #1177bb;
	  }
	
	  .instructions ul {
		padding-left: 20px;
		margin: 0;
		color: #cccccc;
	  }
	
	  .instructions li {
		margin-bottom: 5px;
	  }
	
	  .challenge-info p {
		color: #cccccc;
		font-size: 0.9em;
	  }
	
	  .editor-container {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	  }
	
	  .text-editor {
		flex-grow: 1;
		overflow-y: auto;
		padding: 10px;
	  }
	
	  .text-area {
		font-family: 'Jetbrains Mono', 'Courier New', monospace;
		font-size: 17px;
		line-height: 1.5;
	  }
	
	  .line {
		display: flex;
		align-items: flex-start;
		height: 1.5em;
		white-space: pre;
	  }
	
	  .line-number {
		color: #858585;
		margin-right: 10px;
		user-select: none;
		min-width: 30px;
		text-align: right;
	  }
	
	  .line-content {
		flex-grow: 1;
	  }
	
	  .cursor {
		background-color: #569cd6;
		color: #1e1e1e;
		animation: blink 1s step-end infinite;
	  }
	
	  @keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	  }
	
	  .target {
		background-color: #d4d4d4;
		color: #1e1e1e;
	  }
	
	  .status-bar {
		background-color: #007acc;
		color: #ffffff;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 10px;
		font-size: 0.9em;
	  }
	
	  .mode {
		font-weight: bold;
		padding: 2px 6px;
		border-radius: 4px;
		background-color: #28a745;
	  }
	
	  .mode.insert {
		background-color: #007bff;
	  }
	
	  .mode.command {
		background-color: #dc3545;
	  }
	
	  .command-line {
		background-color: #3c3c3c;
		padding: 10px;
		display: flex;
		align-items: center;
		min-height: 40px;
		border-top: 1px solid #555555;
	  }
	
	  .command-line input {
		width: 100%;
		padding: 5px;
		font-family: inherit;
		font-size: inherit;
		background-color: #2d2d2d;
		color: #ffffff;
		border: 1px solid #555555;
		border-radius: 4px;
	  }
	</style>