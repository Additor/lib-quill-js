#!/bin/bash

echo "move to Web-Frontend Repo"

cp -f dist/quill.js ../additor-web/node_modules/quill/dist/quill.js
cp -f dist/quill.core.js ../additor-web/node_modules/quill/dist/quill.core.js
cp -f dist/unit.js ../additor-web/node_modules/quill/dist/unit.js
