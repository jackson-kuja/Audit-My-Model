#!/bin/bash

# Function to convert a file to TypeScript
convert_file() {
  local file=$1
  local new_file=${file%.js}
  
  # Determine if it's a React component file
  if grep -q "import React" "$file" || grep -q "from 'react'" "$file"; then
    new_file="$new_file.tsx"
  else
    new_file="$new_file.ts"
  fi
  
  # Move the file
  mv "$file" "$new_file"
  echo "Converted $file to $new_file"
}

# Find and convert all JavaScript files
find src -name "*.js" ! -path "*/node_modules/*" | while read -r file; do
  convert_file "$file"
done

# Install required TypeScript dependencies
npm install --save-dev typescript @types/node @types/react @types/react-dom @types/jest @types/react-router-dom 