#!/bin/bash

echo "move to Web-Frontend Repo"
FrontendRepository="../additor-web"

cp -f dist/quill.js $FrontendRepository/node_modules/@additor/quill/dist/quill.js
cp -f dist/quill.core.js $FrontendRepository/node_modules/@additor/quill/dist/quill.core.js
cp -f dist/unit.js $FrontendRepository/node_modules/@additor/quill/dist/unit.js
