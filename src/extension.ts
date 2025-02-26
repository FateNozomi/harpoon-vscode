// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import * as vscode from 'vscode';

const states = ['globalState', 'workspaceState'] as const;
type State = (typeof states)[number];

const key = 'harpoon.files';

export function activate(context: vscode.ExtensionContext) {
  const harpoonUri = getHarpoonUri(context.storageUri);

  let isEditing = false;
  const files: string[] = [];
  const storedFiles = context[getState()].get<string[]>(key);
  if (storedFiles) {
    files.push(...storedFiles);
  }

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
      quickPick.items = getQuickPickItems(files);
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
        quickPick.items = getQuickPickItems(files);
      });

      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('harpoon-vscode.editHarpoon', async () => {
      if (!harpoonUri) {
        return;
      }

      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.createFile(harpoonUri, { overwrite: true });
      await vscode.workspace.applyEdit(workspaceEdit);

      const harpoonDoc = await vscode.workspace.openTextDocument(harpoonUri);
      const harpoonEditor = await vscode.window.showTextDocument(harpoonDoc);

      try {
        isEditing = true;
        await harpoonEditor.edit((editBuilder) => {
          editBuilder.insert(new vscode.Position(0, 0), files.join('\n'));
        });
        await harpoonEditor.document.save();
      } finally {
        isEditing = false;
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (textDocument) => {
      if (!harpoonUri) {
        return;
      }

      if (isEditing) {
        return;
      }

      if (textDocument.uri.fsPath !== harpoonUri.fsPath) {
        return;
      }

      const content = textDocument.getText();
      const parsedFiles = content.split(/\r?\n/).filter((s) => s && s.trim());

      files.length = 0;
      files.push(...parsedFiles);
      context[getState()].update(key, files);

      for (const tabGroup of vscode.window.tabGroups.all) {
        const foundTabs = tabGroup.tabs.filter(
          (tab) =>
            tab.input instanceof vscode.TabInputText &&
            tab.input.uri.fsPath === harpoonUri.fsPath
        );
        await vscode.window.tabGroups.close(foundTabs, false);
      }

      vscode.workspace.fs.delete(harpoonUri);
    })
  );
}

const getHarpoonUri = (
  storageUri: vscode.Uri | undefined
): vscode.Uri | undefined => {
  if (!storageUri) {
    return;
  }

  const storageFolder = path.dirname(storageUri.fsPath);
  const harpoonPath = path.join(storageFolder, '.harpoon');
  return vscode.Uri.file(harpoonPath);
};

const getState = (): State =>
  vscode.workspace.workspaceFolders &&
  vscode.workspace.workspaceFolders.length !== 0
    ? states[1]
    : states[0];

const getQuickPickItems = (files: string[]) =>
  files.map<vscode.QuickPickItem>((file) => ({
    label: getFileName(file),
    description: file,
    buttons: [{ iconPath: new vscode.ThemeIcon('close') }],
  }));

const getFileName = (path: string) =>
  path.split('\\').pop()?.split('/').pop() ?? '';

// This method is called when your extension is deactivated
export function deactivate() {}
