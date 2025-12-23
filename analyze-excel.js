const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const fileBuffer = fs.readFileSync('/home/louisdup/VF/Apps/FF_React/Daily_WA_Drops_18122025.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

console.log('📊 EXCEL FILE ANALYSIS\n');
console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];

// Get raw array data
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('Total Rows:', rawData.length);
console.log('\n=== FIRST 10 ROWS ===\n');

for (let i = 0; i < Math.min(10, rawData.length); i++) {
    console.log(`Row ${i}:`, JSON.stringify(rawData[i], null, 2));
}

console.log('\n=== ANALYZING STRUCTURE ===\n');

if (rawData.length >= 2) {
    console.log('Row 0 (Project Names?):', rawData[0]);
    console.log('Row 1 (Headers?):', rawData[1]);

    if (rawData.length >= 3) {
        console.log('Row 2 (First Data?):', rawData[2]);
    }
}

// Try to detect project columns
console.log('\n=== PROJECT DETECTION ===\n');
const projectRow = rawData[0];
if (projectRow) {
    projectRow.forEach((cell, idx) => {
        if (cell && typeof cell === 'string') {
            console.log(`Column ${idx}: "${cell}"`);
        }
    });
}

// Try to detect headers
console.log('\n=== HEADER DETECTION ===\n');
const headerRow = rawData[1];
if (headerRow) {
    headerRow.forEach((cell, idx) => {
        if (cell) {
            console.log(`Column ${idx}: "${cell}"`);
        }
    });
}
