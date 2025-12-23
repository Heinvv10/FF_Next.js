const XLSX = require('xlsx');
const fs = require('fs');

// Read the original Excel file
const fileBuffer = fs.readFileSync('/home/louisdup/VF/Apps/FF_React/Daily_WA_Drops_18122025.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('🔍 TESTING VALIDATION LOGIC\n');

// ========== TEST 1: Current File (Will Fail) ==========
console.log('=== TEST 1: Current File Format ===\n');
const result1 = extractProjectDataFromExcel(rawData, 'Lawley');
console.log(`Result for project "Lawley": ${result1.length} rows found`);
if (result1.length === 0) {
    console.log('❌ FAILED - No data found (as expected)\n');
} else {
    console.log('✅ SUCCESS - Data found\n');
}

// ========== TEST 2: Modified File (Should Work) ==========
console.log('=== TEST 2: Modified File with Project Name ===\n');

// Create modified data with project name in row 0
const modifiedData = [
    ['Lawley', null, null], // Row 0: Project name
    ...rawData              // Row 1+: Original data (headers + data)
];

const result2 = extractProjectDataFromExcel(modifiedData, 'Lawley');
console.log(`Result for project "Lawley": ${result2.length} rows found`);
if (result2.length > 0) {
    console.log('✅ SUCCESS - Data found!');
    console.log('\nFirst 3 records:');
    result2.slice(0, 3).forEach((row, idx) => {
        console.log(`  ${idx + 1}. Date: ${row.date}, DR: ${row.dropNumber}, Time: ${row.time}`);
    });
} else {
    console.log('❌ FAILED - No data found\n');
}

// ========== TEST 3: Create Modified Excel File ==========
console.log('\n=== TEST 3: Creating Modified Excel File ===\n');

// Create new workbook with modified data
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.aoa_to_sheet(modifiedData);
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, '1812');

// Write to file
XLSX.writeFile(newWorkbook, '/home/louisdup/VF/Apps/FF_React/Daily_WA_Drops_18122025_FIXED.xlsx');
console.log('✅ Created fixed file: Daily_WA_Drops_18122025_FIXED.xlsx');
console.log('   This file has "Lawley" in row 0 and should work with the validation\n');

// ========== HELPER FUNCTION (from the API code) ==========
function extractProjectDataFromExcel(rawData, projectName) {
    if (rawData.length < 3) return [];

    const projectRow = rawData[0];
    const headerRow = rawData[1];

    // Find which column group contains this project
    let projectColumnStart = -1;
    for (let i = 0; i < projectRow.length; i++) {
        const cellValue = projectRow[i];
        if (cellValue && typeof cellValue === 'string') {
            const normalized = cellValue.trim();
            if (normalized.toLowerCase().includes(projectName.toLowerCase()) ||
                projectName.toLowerCase().includes(normalized.toLowerCase())) {
                projectColumnStart = i;
                break;
            }
        }
    }

    if (projectColumnStart === -1) {
        return [];
    }

    // Find the columns for Date, DR nr, Time
    let dateCol = -1, drCol = -1, timeCol = -1;
    for (let i = projectColumnStart; i < Math.min(projectColumnStart + 5, headerRow.length); i++) {
        const header = headerRow[i];
        if (header && typeof header === 'string') {
            const lower = header.toLowerCase().trim();
            if (lower === 'date' && dateCol === -1) dateCol = i;
            else if (lower.includes('dr') && lower.includes('nr') && drCol === -1) drCol = i;
            else if (lower === 'time' && timeCol === -1) timeCol = i;
        }
    }

    if (dateCol === -1 || drCol === -1) {
        return [];
    }

    // Extract data rows (skip row 0 and 1)
    const results = [];
    for (let i = 2; i < rawData.length; i++) {
        const row = rawData[i];
        const dateValue = row[dateCol];
        const drValue = row[drCol];
        const timeValue = timeCol !== -1 ? row[timeCol] : null;

        if (drValue) {
            results.push({
                date: dateValue,
                dropNumber: drValue,
                time: timeValue,
            });
        }
    }

    return results;
}
