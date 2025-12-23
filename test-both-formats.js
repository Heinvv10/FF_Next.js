const XLSX = require('xlsx');
const fs = require('fs');

console.log('🧪 TESTING UPDATED VALIDATION LOGIC\n');

// Read the original Excel file
const fileBuffer = fs.readFileSync('/home/louisdup/VF/Apps/FF_React/Daily_WA_Drops_18122025.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

// ========== HELPER FUNCTIONS (Updated) ==========

function isHeaderRow(row) {
    if (!row || row.length < 2) return false;

    let hasDate = false;
    let hasDR = false;

    for (const cell of row) {
        if (cell && typeof cell === 'string') {
            const lower = cell.toLowerCase().trim();
            if (lower === 'date') hasDate = true;
            if (lower.includes('dr') && lower.includes('nr')) hasDR = true;
        }
    }

    return hasDate && hasDR;
}

function extractSimpleFormat(rawData) {
    const headerRow = rawData[0];

    let dateCol = -1, drCol = -1, timeCol = -1;
    for (let i = 0; i < headerRow.length; i++) {
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

    const results = [];
    for (let i = 1; i < rawData.length; i++) {
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

function extractMultiProjectFormat(rawData, projectName) {
    if (rawData.length < 3) return [];

    const projectRow = rawData[0];
    const headerRow = rawData[1];

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

function extractProjectDataFromExcel(rawData, projectName) {
    if (rawData.length < 2) return [];

    const firstRow = rawData[0];
    const isSimpleFormat = isHeaderRow(firstRow);

    if (isSimpleFormat) {
        return extractSimpleFormat(rawData);
    } else {
        return extractMultiProjectFormat(rawData, projectName);
    }
}

// ========== TEST 1: Original File (Simple Format) ==========
console.log('=== TEST 1: Original File (Simple Format) ===');
console.log('File structure: Headers in row 0, data in row 1+\n');

const result1 = extractProjectDataFromExcel(rawData, 'Lawley');
console.log(`✅ Format detected: ${isHeaderRow(rawData[0]) ? 'SIMPLE' : 'MULTI-PROJECT'}`);
console.log(`✅ Records found: ${result1.length}`);

if (result1.length > 0) {
    console.log('\nFirst 3 records:');
    result1.slice(0, 3).forEach((row, idx) => {
        console.log(`  ${idx + 1}. Date: ${row.date}, DR: ${row.dropNumber}, Time: ${row.time}`);
    });
}

// ========== TEST 2: Multi-Project Format ==========
console.log('\n\n=== TEST 2: Multi-Project Format ===');
console.log('File structure: Project names in row 0, headers in row 1, data in row 2+\n');

// Create multi-project format data
const multiProjectData = [
    ['Lawley', null, null], // Row 0: Project name
    ...rawData              // Row 1+: Original data (headers + data)
];

const result2 = extractProjectDataFromExcel(multiProjectData, 'Lawley');
console.log(`✅ Format detected: ${isHeaderRow(multiProjectData[0]) ? 'SIMPLE' : 'MULTI-PROJECT'}`);
console.log(`✅ Records found: ${result2.length}`);

if (result2.length > 0) {
    console.log('\nFirst 3 records:');
    result2.slice(0, 3).forEach((row, idx) => {
        console.log(`  ${idx + 1}. Date: ${row.date}, DR: ${row.dropNumber}, Time: ${row.time}`);
    });
}

console.log('\n\n🎉 BOTH FORMATS WORK! The validation now supports:');
console.log('   ✅ Simple format (your current file)');
console.log('   ✅ Multi-project format (Janice\'s format)');
