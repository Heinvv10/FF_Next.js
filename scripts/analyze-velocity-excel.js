const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

function analyzeVelocityExcel() {
  const filePath = '/home/louisdup/Downloads/Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx';

  console.log('='.repeat(80));
  console.log('    NOKIA FIBERTIME VELOCITY REPORT ANALYSIS');
  console.log('='.repeat(80));
  console.log(`File: ${path.basename(filePath)}`);
  console.log(`Size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Date in filename: 15/09/2025 (Week ending)\n`);

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);

    console.log('📊 WORKSHEET OVERVIEW:');
    console.log('-'.repeat(60));
    console.log(`Total Sheets: ${workbook.SheetNames.length}`);
    console.log('Sheet Names:');
    workbook.SheetNames.forEach((name, idx) => {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const rowCount = range.e.r - range.s.r + 1;
      const colCount = range.e.c - range.s.c + 1;
      console.log(`  ${idx + 1}. "${name}": ${rowCount} rows x ${colCount} columns`);
    });

    // Analyze each sheet
    console.log('\n📋 DETAILED SHEET ANALYSIS:');
    console.log('='.repeat(60));

    workbook.SheetNames.forEach((sheetName, idx) => {
      console.log(`\n${idx + 1}. SHEET: "${sheetName}"`);
      console.log('-'.repeat(40));

      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length === 0) {
        console.log('  [Empty sheet]');
        return;
      }

      // Get headers (first non-empty row)
      let headers = [];
      let headerRow = 0;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        if (data[i] && data[i].length > 0 && data[i].some(cell => cell)) {
          headers = data[i];
          headerRow = i;
          break;
        }
      }

      console.log(`  Headers at row ${headerRow + 1}:`);
      headers.forEach((header, idx) => {
        if (header && idx < 15) { // Show first 15 columns
          console.log(`    Column ${String.fromCharCode(65 + idx)}: ${header}`);
        }
      });

      // Sample data
      const dataRows = data.slice(headerRow + 1).filter(row => row && row.length > 0);
      console.log(`\n  Data rows: ${dataRows.length}`);

      if (dataRows.length > 0) {
        console.log('  Sample data (first 3 rows):');
        dataRows.slice(0, 3).forEach((row, rowIdx) => {
          console.log(`    Row ${rowIdx + 1}:`);
          headers.forEach((header, colIdx) => {
            if (header && row[colIdx] !== undefined && row[colIdx] !== '' && colIdx < 10) {
              console.log(`      ${header}: ${row[colIdx]}`);
            }
          });
        });
      }

      // Identify key columns for linking
      console.log('\n  🔗 Potential Linking Fields:');
      const linkingKeywords = ['pole', 'drop', 'property', 'address', 'coordinates', 'lat', 'long',
                              'customer', 'ont', 'fiber', 'cable', 'segment', 'id', 'number'];

      headers.forEach((header, idx) => {
        if (header) {
          const headerLower = header.toString().toLowerCase();
          if (linkingKeywords.some(keyword => headerLower.includes(keyword))) {
            // Get sample values
            const sampleValues = dataRows
              .slice(0, 5)
              .map(row => row[idx])
              .filter(val => val)
              .slice(0, 3);

            console.log(`    ✓ ${header}:`);
            if (sampleValues.length > 0) {
              console.log(`      Samples: ${sampleValues.join(', ')}`);
            }
          }
        }
      });

      // Check for velocity/progress metrics
      console.log('\n  📈 Velocity/Progress Metrics:');
      const metricKeywords = ['week', 'date', 'progress', 'velocity', 'completed', 'installed',
                             'total', 'percentage', 'status', 'planned', 'actual'];

      headers.forEach((header, idx) => {
        if (header) {
          const headerLower = header.toString().toLowerCase();
          if (metricKeywords.some(keyword => headerLower.includes(keyword))) {
            console.log(`    ✓ ${header}`);
          }
        }
      });
    });

    // Summary and recommendations
    console.log('\n\n' + '='.repeat(80));
    console.log('                    SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(80));

    console.log('\n📌 KEY FINDINGS:');
    console.log('  1. Nokia Fibertime data - likely installation/progress tracking');
    console.log('  2. Week ending 15/09/2025 - velocity/progress report');
    console.log('  3. Multiple sheets with different data types');

    console.log('\n🔗 LINKING OPPORTUNITIES:');
    console.log('  • Check for pole numbers matching SOW data');
    console.log('  • Look for drop/property IDs matching OneMap');
    console.log('  • Geographic coordinates for proximity matching');
    console.log('  • Customer/property details for validation');

    console.log('\n📊 RECOMMENDED IMPORT STRATEGY:');
    console.log('  1. Create new table: nokia_velocity_data');
    console.log('  2. Import all sheets with progress tracking');
    console.log('  3. Link via pole/drop numbers where possible');
    console.log('  4. Add velocity metrics to grid view');
    console.log('  5. Track weekly progress trends');

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error analyzing Excel file:', error);
    console.error('Make sure the file path is correct and the file is readable.');
  }
}

analyzeVelocityExcel();