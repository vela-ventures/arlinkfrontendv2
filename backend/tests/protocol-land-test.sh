#!/bin/bash

echo "Deploying Protocol Land Test"

curl -X POST http://localhost:3050/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "repository": "proland://bae9d6a0-94c4-4bdc-86e7-18303936bcf5",
    "branch": "main",
    "installCommand": "npm install",
    "buildCommand": "npm run build",
    "outputDir": "dist",
    "protocolLand": true,
    "walletAddress": "SapV2fhfdlNxDOMkpKPmSEacziuC2ELcHVF4efUBx4U",
    "repoName": "ForeverAI"
  }'

echo "Protocol Land Test Over"