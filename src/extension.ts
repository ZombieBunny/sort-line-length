import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.sortLineLength', () => {
		const editor = vscode.window.activeTextEditor;

		// identify language
		// define sorting strategy for multiline support
		// apply sorting logic based on language
		const language = editor?.document.languageId;


		const selection = editor!.selection;

		if (selection && selection.isEmpty) {
			vscode.window.showInformationMessage(`Select a few lines of text before we get sorted!`);
		}

		if (selection && !selection.isEmpty) {
			const lines: any[] = [];
			// get highlighted lines
			for (let i = selection.start.line; i <= selection.end.line; i++) {
				const line = editor!.document.lineAt(i);
				const range = new vscode.Range(line.range.start, line.range.end);
				const text = editor!.document.getText(range)
				lines.push(text);
			}


			const huh = groupLines(lines);
			// flattern lines into single line string
			const beforeLines = JSON.parse(JSON.stringify(lines.join(",").toString()));

			// then sort lines 
			lines.sort(function (a, b) { return b.length - a.length });

			// then flatten sorted lines into single line
			const afterLines = JSON.parse(JSON.stringify(lines.join(",").toString()));

			// after sorting, if lines match, then change direction of sort.
			// this means that the user has triggered the event while the same text is highlighted.
			// we just want to invrert sorting in thsi scenario.
			if (beforeLines === afterLines) {
				lines.sort(function (a, b) { return a.length - b.length });
			}

			// replace selected with sorted lines!
			editor!.edit(editBuilder => {
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					const line = editor!.document.lineAt(i);
					const range = new vscode.Range(line.range.start, line.range.end);
					const direction = selection.start.line - i;
					editBuilder.replace(range, lines[Math.abs(direction)]);
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

// Define multi line support:
// JS/TS
// identify line start and line end.
// - use regex ?? : ^import\s+{[\s\S]*?}\s+from\s+'[\s\S]*?';
// string.includes = ['import','const'];
// string.includes = ['from','requires',';'];
const groupLines = (lines: string[]): string => {
	// create multi
	const line = JSON.parse(JSON.stringify(lines.join("|").toString()));
	const regex = /import\s+{[\s\S]?(\|[\s\S]+?)}\s+from\s+'[\w\s\S]*?';/g;

	const matches = line.match(regex);
	if (matches) {
		console.log("Found multiline text:");
		console.log(matches);
	} else {
		console.log("No multiline text found.");
	}

	return "";
}


// this method is called when your extension is deactivated
export function deactivate() { }
