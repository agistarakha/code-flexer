// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");

/**
 * Scrolls down and to the right in the active text editor if the content is overlapping.
 */
function scrollDownAndRight() {
  // Get the currently active text editor.
  const editor = vscode.window.activeTextEditor;

  // If an editor is active.
  if (editor) {
    // Get the number of lines in the document.
    const lineCount = editor.document.lineCount;

    // Get the last line of the document.
    const lastLine = editor.document.lineAt(lineCount - 1);

    // Get the range of the last line.
    const lastLineRange = lastLine.range;

    // Get the visible range of the editor.
    const visibleRange = editor.visibleRanges[0];

    // Check if the last line is below the visible range.
    const isOverlapping = lastLineRange.start.line > visibleRange.end.line;

    // If the content overlaps.
    if (isOverlapping) {
      // Scroll to the range of the last line.
      editor.revealRange(lastLineRange, vscode.TextEditorRevealType.Default);
    }
  }
}

/**

Inserts text at the current cursor position in the active text editor.
@param {string} text - The text to be inserted.
*/
function insertText(text) {
  const editor = vscode.window.activeTextEditor;

  // If there is an active text editor, get the current selection and insert the text
  if (editor) {
    const selection = editor.selection;

    // Use the `edit()` method of the editor to perform the insertion
    editor.edit((editBuilder) => {
      editBuilder.insert(selection.start, text);
    });
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)

  let disposable = vscode.commands.registerCommand(
    "on-sterocode.runSteroCode",
    async function () {
      let uri = "";

      let lines = vscode.window.activeTextEditor.document.lineCount;
      let i = 0;
      let isEnded = false;
      let editorCode = ""; // a variable to store current editor code values
      let obj = { currentCode: "" }; // an object to store the value of the code text that will be generated.

      // select the file that will be used for code reference
      const result = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
      });
      if (result && result[0]) {
        uri = result[0].fsPath;
      }
      let code = fs.readFileSync(uri.toString(), "utf-8");
      code = code.replaceAll("\n", "\r\n");
      code = code.replaceAll("\r\r", "\r");
      // let code2 = fs.readFileSync(
      //   uri.toString().replace("extension.js", "importo.js"),
      //   "utf-8"
      // );
      // console.log(code == code2);
      // const eol = vscode.EndOfLine;
      // fs.writeFileSync("code-flexer-temp", code, "utf-8");
      // for (let c of code.split("\n")) {
      //   fs.appendFileSync("code-flexer-temp", c + eol, "utf-8");
      // }
      // code = fs.readFileSync("code-flexer-temp", "utf8");
      // fs.unlink("code-flexer-temp", (err) => {
      //   if (err) {
      //     console.error(err);
      //     return;
      //   }
      // });
      // console.log(code);
      const totalLines = code.split("\n").length;

      // Select code rewrite speed.

      let speed = await vscode.window.showQuickPick(
        ["1", "2", "3", "4", "5", "6", "7", "8"],
        {
          placeHolder: "Select SteroCode speed(speed=character/type)",
        }
      );
      let selectedSpeed = parseInt(speed);

      // executed when the let obj = { currentCode: "" } object value changes
      let OnCurrentCodeChanges = {
        set: function (target, prop, value) {
          // Get current editor code
          editorCode = vscode.window.activeTextEditor.document.getText();

          // get the difference between editor code and upcoming code
          let input = code.slice(editorCode.length, value.length);
          insertText(input);
          target[prop] = value;
          return target[prop];
        },
        get: function (target, prop) {
          return target[prop];
        },
      };

      // Observe obj object changes
      let proxyObj = new Proxy(obj, OnCurrentCodeChanges);

      // Called when the user types something on the editor
      let typeCmdDisposable = vscode.commands.registerCommand("type", (e) => {
        // If the rewrite code is ended, the keyboard will return to normal typing behavior.
        if (isEnded) {
          const { text } = e;
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit((editBuilder) => {
              editBuilder.insert(editor.selection.active, text);
            });
          }
        }

        // other keyboard behavior
        else {
          // Speed configuration
          for (let j = 0; j < selectedSpeed; j++) {
            proxyObj.currentCode += code[i + j];
          }
          i++;

          // Scroll down or right if text editor content overlaps
          scrollDownAndRight();

          lines = vscode.window.activeTextEditor?.document.lineCount;

          // If the rewrite ended, end the rewrite after a 2 second delay.
          if (lines >= totalLines) {
            setTimeout(() => {
              isEnded = true;
              // vscode.commands.executeCommand("on-sterocode.reloadSteroCode");
            }, 2000);
          }
        }
      });

      context.subscriptions.push(typeCmdDisposable);
    }
  );

  context.subscriptions.push(disposable);

  let reloadCommand = vscode.commands.registerCommand(
    "on-sterocode.reloadSteroCode",
    () => {
      vscode.commands.executeCommand("workbench.action.reloadWindow");
      // disposable.dispose();
    }
  );

  context.subscriptions.push(reloadCommand);
}

// This method is called when your extension is deactivated
function deactivate() {
  console.log("stopped");
}
module.exports = {
  activate,
  deactivate,
};
