import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.sortLineLength', () => {
		const editor = vscode.window.activeTextEditor;
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

			const lineMap = mapLines(lines);
			const defaultLines = JSON.parse(JSON.stringify(lines));

			// must be a better way to define these function/s.
			const sortAFunction = (a: string, b: string) => {
				const [aIndex, bIndex] = [defaultLines.indexOf(a) + 1, defaultLines.indexOf(b) + 1];
				const [aValue, bValue] = [lineMap[`line_${aIndex}`] ?? a.length, lineMap[`line_${bIndex}`] ?? b.length]
				// defaultLines1.splice(defaultLines1.indexOf(a), 1);
				// defaultLines1.splice(defaultLines1.indexOf(b), 1);
				// defaultLines1.indexOf(a) > 0 ? defaultLines1.splice(defaultLines1.indexOf(a), 1) : null;
				// defaultLines1.indexOf(b) > 0 ? defaultLines1.splice(defaultLines1.indexOf(b), 1) : null;
				return bValue - aValue;
			}
			const sortDFunction = (a: string, b: string) => {
				const [aIndex, bIndex] = [defaultLines.indexOf(a) + 1, defaultLines.indexOf(b) + 1];
				const [aValue, bValue] = [lineMap[`line_${aIndex}`] ?? a.length, lineMap[`line_${bIndex}`] ?? b.length]
				// defaultLines2.indexOf(a) > 0 ? defaultLines2.splice(defaultLines2.indexOf(a), 1) : null;
				// defaultLines2.indexOf(b) > 0 ? defaultLines2.splice(defaultLines2.indexOf(b), 1) : null;
				return aValue - bValue;
			}

			const beforeLines = JSON.parse(JSON.stringify(lines.join(",").toString()));
			lines.sort(sortAFunction);
			const afterLines = JSON.parse(JSON.stringify(lines.join(",").toString()));

			// after sorting, if lines match, then change direction of sort.
			// this means that the user has triggered the event while the same text is highlighted.
			// we just want to invrert sorting in thsi scenario.
			if (beforeLines === afterLines) {
				lines.sort(sortDFunction);
				// lines.sort(function (a, b) { return a.length - b.length });
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
const mapLines = (lines: string[]): { [key: string]: number } => {
	const matchMap: { [key: string]: number } = {};

	// identify language
	// const language = editor?.document.languageId;

	// @TODO: expose identifier used to join lines
	const line = JSON.parse(JSON.stringify(lines.join("|").toString()));

	// @TODO: add ability for user to use custom identifier
	// default to this if error/no value selected.
	const regex = /import\s+{[\s\S]?(\|[\s\S]+?)}\s+from\s+'[\w\s\S]*?';/g;
	const matches = line.match(regex);

	if (!matches) {
		return matchMap;
	}

	for (let match of matches) {
		// implement abilityt to handle multiple multi line matches!
		// const match: string = matches[0] ?? "";
		const startIndex: number = line.indexOf(match);

		// lines before match
		const precedingLineNumbers: number = (line.substring(0, startIndex)).split("|").length;

		// length of match
		const matchTextLength: number = match.length;
		// work out average length
		const maxAverageLength = (match.split("|")).sort(function (a: string, b: string) { return a.length - b.length })[0].length;
		const minAverageLength = (match.split("|")).sort(function (a: string, b: string) { return b.length - a.length })[0].length;

		const matchLineNumbers: number = (line.substring(startIndex, startIndex + matchTextLength)).split("|").length;
		const endRange = precedingLineNumbers + matchLineNumbers;
		for (let i = precedingLineNumbers; i < endRange; i++) {
			matchMap[`line_${i}`] = minAverageLength;
		}
	}

	return matchMap;
}


// this method is called when your extension is deactivated
export function deactivate() { }
