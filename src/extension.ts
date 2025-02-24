// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { homedir } from 'os';
import path from 'path';
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

  const storedFiles = context[getState()].get<string[]>(key);
  if (storedFiles) {
    files.push(...storedFiles);
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand('harpoon-vscode.addToHarpoon', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      files.push(editor.document.fileName);
      context[getState()].update(key, files);
      vscode.window.showInformationMessage('Added to Harpoon');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('harpoon-vscode.goToHarpoon', async () => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = getQuickPickItems();
      quickPick.matchOnDescription = true;
      quickPick.placeholder = 'Search files by name';

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
        context[getState()].update(key, files);
        quickPick.items = getQuickPickItems();
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('harpoon-vscode.editHarpoon', async () => {
      const homeDir = homedir();
      if (!homeDir) {
        return;
      }

      const harpoonPath = path.join(homeDir, '.vscode', '.harpoon');
      const harpoonUri = vscode.Uri.file(harpoonPath);

      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.createFile(harpoonUri, { overwrite: true });
      await vscode.workspace.applyEdit(workspaceEdit);

      const harpoonDoc = await vscode.workspace.openTextDocument(harpoonUri);
      const harpoonEditor = await vscode.window.showTextDocument(harpoonDoc);
      await harpoonEditor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(0, 0), files.join('\n'));
      });

      const documentDisposables: vscode.Disposable[] = [];
      documentDisposables.push(
        vscode.workspace.onDidSaveTextDocument((textDocument) => {
          if (textDocument.uri.fsPath !== harpoonUri.fsPath) {
            return;
          }

          const content = textDocument.getText();
          const parsedFiles = content
            .split(/\r?\n/)
            .filter((s) => s && s.trim());
          files.length = 0;
          files.push(...parsedFiles);
          context[getState()].update(key, files);
          vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        })
      );

      documentDisposables.push(
        vscode.window.onDidChangeVisibleTextEditors((textEditors) => {
          console.log(textEditors);
          const harpoonEditorOpened = textEditors.some(
            (editor) => editor.document.uri.fsPath === harpoonUri.fsPath
          );
          if (harpoonEditorOpened) {
            return;
          }

          console.log(`onDidChangeVisibleTextEditors: saving Harpoon Editor`);
          saveHarpoonEditor();
        })
      );

      documentDisposables.push(
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
          const isHarpoonDocumentClosed =
            textDocument.uri.fsPath === harpoonUri.fsPath;
          if (!isHarpoonDocumentClosed) {
            return;
          }

          console.log('onDidCloseTextDocument');
        })
      );

      const saveHarpoonEditor = () => {
        vscode.workspace.fs.delete(harpoonUri);
        documentDisposables.forEach((d) => d.dispose());
      };
    })
  );
}

const getState = (): State =>
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
