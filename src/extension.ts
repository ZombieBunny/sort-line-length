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
			const sortAFunction = (a: any, b: any) => {
				// const [aIndex, bIndex] = [defaultLines.indexOf(a) + 1, defaultLines.indexOf(b) + 1];
				// const [aValue, bValue] = [lineMap[`line_${aIndex}`] ?? a.length, lineMap[`line_${bIndex}`] ?? b.length]
				// defaultLines1.splice(defaultLines1.indexOf(a), 1);
				// defaultLines1.splice(defaultLines1.indexOf(b), 1);
				// defaultLines1.indexOf(a) > 0 ? defaultLines1.splice(defaultLines1.indexOf(a), 1) : null;
				// defaultLines1.indexOf(b) > 0 ? defaultLines1.splice(defaultLines1.indexOf(b), 1) : null;
				// return bValue - aValue;
				return b.lineLength - a.lineLength
			}
			const sortDFunction = (a: any, b: any) => {
				// const [aIndex, bIndex] = [defaultLines.indexOf(a) + 1, defaultLines.indexOf(b) + 1];
				// const [aValue, bValue] = [lineMap[`line_${aIndex}`] ?? a.length, lineMap[`line_${bIndex}`] ?? b.length]
				// defaultLines2.indexOf(a) > 0 ? defaultLines2.splice(defaultLines2.indexOf(a), 1) : null;
				// defaultLines2.indexOf(b) > 0 ? defaultLines2.splice(defaultLines2.indexOf(b), 1) : null;
				// return aValue - bValue;
				return a.lineLength - b.lineLength
			}

			// const beforeLines = JSON.parse(JSON.stringify(lines.join(",").toString()));
			const beforeLines = JSON.parse(JSON.stringify([lineMap.map(l => l.lineValue)].join(",").toString()));
			// lines.sort(sortAFunction);
			lineMap.sort(sortAFunction);
			// lines.sort(function (a, b) { return b.length - a.length });
			const afterLines = JSON.parse(JSON.stringify([lineMap.map(l => l.lineValue)].join(",").toString()));
			// const afterLines = JSON.parse(JSON.stringify(lines.join(",").toString()));


			// after sorting, if lines match, then change direction of sort.
			// this means that the user has triggered the event while the same text is highlighted.
			// we just want to invrert sorting in thsi scenario.
			if (beforeLines === afterLines) {
				// lines.sort(sortDFunction);
				lineMap.sort(sortDFunction);
				// lines.sort(function (a, b) { return a.length - b.length });
			}

			// replace selected with sorted lines!
			editor!.edit(editBuilder => {
				for (let i = selection.start.line; i <= selection.end.line; i++) {
					const line = editor!.document.lineAt(i);
					const range = new vscode.Range(line.range.start, line.range.end);
					const direction = selection.start.line - i;
					// editBuilder.replace(range, lines[Math.abs(direction)]);
					editBuilder.replace(range, lineMap[Math.abs(direction)].lineValue);
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

const mapLines = (lines: string[]): { lineLength: number, lineValue: string }[] => {
	const mappedLines: { lineLength: number, lineValue: string }[] = [];
	const matchMap: { [key: string]: number } = {};
	// const language = editor?.document.languageId;

	// @TODO: expose identifier used to join lines
	const line = JSON.parse(JSON.stringify(lines.join("|").toString()));

	// @TODO: add ability for user to use custom identifier
	// default to this if error/no value selected.
	const regex = /import\s+{[\s\S]?(\|[\s\S]+?)}\s+from\s+'[\w\s\S]*?';/g;
	
	const matches = line.match(regex);

	for (let match of matches ?? []) {

		// the index of the first character of the match
		const startIndex: number = line.indexOf(match);

		// lines before matched characters
		const precedingLineNumbers: number = (line.substring(0, startIndex)).split("|").length;

		// length of characters of match
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

	for (let i = 1; i <= lines?.length; i++) {
		const l = {
			lineLength: matchMap[`line_${i}`] > 0 ? matchMap[`line_${i}`] : lines[i - 1]?.length,
			lineValue: lines[i - 1]
		}
		mappedLines.push(l);
	}

	return mappedLines;
}


// this method is called when your extension is deactivated
export function deactivate() { }
