#!/bin/bash

for i in {1..20}
do
   echo "Sending request $i"
   curl -X POST http://localhost:3001/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "repository": "https://github.com/internettrashh/preact-test-template.git",
       "installCommand": "npm install",
       "buildCommand": "npm run build",
       "outputDir": "dist",
       "branch": "main",
       "subDirectory": ""
     }'
   echo -e "\n"  # Add a newline for better readability
   sleep 1  # Wait for 1 second between requests to avoid overwhelming the server
done
