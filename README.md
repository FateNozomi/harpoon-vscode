# harpoon-vscode

`harpoon-vscode` is a minimal port of the `neovim` extension `harpoon` created by `ThePrimeagen`.

## Features

- `Add to Harpoon`: Adds active editor file to Harpoon's list.
- `Go to Harpoon...`: Go to File via Quick Pick.
- `Edit Harpoon...`: Opens an editable '.harpoon' file containing Harpoon's list. Upon saving, opens file under cursor in editor if path is valid.

## Extension Settings

- `harpoon-vscode.addToHarpoon`: Adds active editor file to Harpoon's list.
- `harpoon-vscode.goToHarpoon`: Go to File via Quick Pick.
- `harpoon-vscode.editHarpoon`: Opens an editable '.harpoon' file containing Harpoon's list..

## Known Issues

None.

## Release Notes

### 0.0.3
- If current active editor file is in the Harpoon's list, it will be shown as the first item in Quick Pick.
- When opening '.harpoon' from a harpoon-ed active editor file, the cursor will be positioned at the respective file.
- Upon closing '.harpoon', the file under the cursor will be opened in the editor.

### 0.0.2

- Clean up logs and README.

### 0.0.1

- Initial release of harpoon-vscode.
