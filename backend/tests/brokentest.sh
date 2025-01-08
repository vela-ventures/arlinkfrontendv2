#!/bin/bash

echo "Testing deploy endpoint..."
curl -X POST http://localhost:3050/deploy \
-H "Content-Type: application/json" \
-d '{
  "repository": "https://github.com/ARlinklabs/preact-test-template.git",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDir": "dist",
  "branch": "main",
  "subDirectory": "",
  "protocolLand": false
}'

echo -e "\n"


