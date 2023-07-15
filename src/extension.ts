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

			const beforeLines = JSON.parse(JSON.stringify(lines.join(",").toString()));
			lines.sort(function (a, b) { return b.length - a.length });
			const afterLines = JSON.parse(JSON.stringify(lines.join(",").toString()));

			// after sorting, if lines match, then change direction of sort
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

// this method is called when your extension is deactivated
export function deactivate() { }
