#!/usr/bin/env node

/**
 * Verification script to ensure the bot is completely self-contained
 * This script checks that no files import from external directories
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying bot is self-contained...\n');

const botDir = __dirname;
const externalDependencies = [];
const checkedFiles = [];

function checkFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(botDir, filePath);
    checkedFiles.push(relativePath);
    
    // Check for require statements that go outside the bot directory
    const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
    
    // Check for import statements that go outside the bot directory
    const importMatches = content.match(/import.*['"`]([^'"`]+)['"`]/g) || [];
    
    const allMatches = [...requireMatches, ...importMatches];
    
    for (const match of allMatches) {
        // Extract the module path
        const moduleMatch = match.match(/['"`]([^'"`]+)['"`]/);
        if (!moduleMatch) continue;
        
        const modulePath = moduleMatch[1];
        
        // Skip npm packages (they don't start with ./ or ../)
        if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) continue;
        
        // Check if it's an external relative import that goes outside the bot directory
        // Calculate the absolute path to see if it goes outside the bot folder
        const fromDir = path.dirname(filePath);
        const resolvedPath = path.resolve(fromDir, modulePath);
        const normalizedBotDir = path.resolve(botDir);
        
        // If the resolved path is outside the bot directory, it's external
        if (!resolvedPath.startsWith(normalizedBotDir)) {
            externalDependencies.push({
                file: relativePath,
                dependency: modulePath,
                resolvedPath: path.relative(process.cwd(), resolvedPath),
                line: content.split('\n').findIndex(line => line.includes(match)) + 1
            });
        }
    }
}

function scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and hidden directories
            if (item === 'node_modules' || item.startsWith('.')) continue;
            scanDirectory(fullPath);
        } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
            checkFile(fullPath);
        }
    }
}

// Scan the bot directory
scanDirectory(botDir);

console.log(`📁 Scanned ${checkedFiles.length} files:`);
checkedFiles.forEach(file => console.log(`   ✓ ${file}`));

console.log('\n🔍 External dependency check:');

if (externalDependencies.length === 0) {
    console.log('✅ SUCCESS: Bot is completely self-contained!');
    console.log('✅ No external dependencies found');
    console.log('\n🎯 The bot can run independently without any other project folders');
    process.exit(0);
} else {
    console.log('❌ FAILURE: External dependencies found:');
    externalDependencies.forEach(dep => {
        console.log(`   ❌ ${dep.file}:${dep.line} -> ${dep.dependency} (resolves to: ${dep.resolvedPath})`);
    });
    console.log('\n⚠️  The bot has external dependencies and is not self-contained');
    console.log('\n🔧 These dependencies must be removed or moved into the bot folder');
    process.exit(1);
} 