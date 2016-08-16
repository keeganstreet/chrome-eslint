# Chrome ESLint

A Chrome Extension to run [ESLint](http://eslint.org/) over all the scripts in the current page.

## Why?

Normally ESLint is used in your development environment to ensure your code passes your style guides and rules. JavaScript is usually then minified before deployment. So why would you want to run ESLint on a page that has been deployed and probably uses minified JavaScript?

The answer is that some JavaScript may have been added to your page outside of your normal build processes, for example third party analytics scripts, and you would like to lint the entire set of JavaScript on the page. For example you might need to debug a production issue where two different third party scripts are writing to the same global variable. This extension can show you all the code that sets global variables, so you can quickly find which two libraries are conflicting.

## Installation

This extension is functional but not yet released to the Chrome Web Store. If you know what you're doing, you can load this as an unpacked extension.

## How it works

1. Extension scans the page for JavaScript.
2. External scripts are loaded. Inline scripts are read from the page.
3. The scripts are beautified because it is hard to read the ESLint output for a minified script.
4. Each script is linted with ESLint according to the rules in the extension options page.
5. Results are displayed in the extension popup.

### Dependencies

#### ESLint and Espree
A build of eslint.js to run in the browser is downloaded from http://eslint.org/demo/ (http://eslint.org/js/app/eslint.js)

#### Escodegen
A build of Escodegen to run in the browser is downloaded from https://github.com/estools/escodegen/tree/1.8.0
