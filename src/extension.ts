// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const states = ['globalState', 'workspaceState'] as const;
type State = (typeof states)[number];

const key = 'harpoon.files';

const files: string[] = [];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "harpoon-vscode" is now active!'
  );

  const disposables: vscode.Disposable[] = [];

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  disposables.push(
    vscode.commands.registerCommand('harpoon-vscode.addToHarpoon', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      files.push(editor.document.fileName);

      // Display a message box to the user
      vscode.window.showInformationMessage('Added to Harpoon');
    })
  );

  disposables.push(
    vscode.commands.registerCommand('harpoon-vscode.goToHarpoon', async () => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = getQuickPickItems();
      quickPick.matchOnDescription = true;
      quickPick.onDidChangeSelection((selection) => {
        if (selection[0]) {
          const uri = vscode.Uri.file(selection[0].description!);
          vscode.window.showTextDocument(uri);
        }
      });

      quickPick.onDidTriggerItemButton((e) => {
        const index = files.indexOf(e.item.description!);
        if (index === -1) {
          return;
        }

        files.splice(index, 1);
        quickPick.items = getQuickPickItems();
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );

  disposables.push(
    vscode.commands.registerCommand('harpoon-vscode.editHarpoon', () => {})
  );

  context.subscriptions.push(...disposables);
}

const getState = () =>
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length !== 0
    ? states[1]
    : states[0];

const getQuickPickItems = () =>
  files.map<vscode.QuickPickItem>((file) => ({
    label: getFileName(file),
    description: file,
    iconPath: new vscode.ThemeIcon('file'),
    buttons: [{ iconPath: new vscode.ThemeIcon('close') }],
  }));

const getFileName = (path: string) =>
  path.split('\\').pop()?.split('/').pop() ?? '';

// This method is called when your extension is deactivated
export function deactivate() {}
