const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function generateFieldVerificationReport() {
  try {
    console.log('=== GENERATING FIELD VERIFICATION REPORT ===\n');
    const reportDate = new Date().toISOString().split('T')[0];
    const reportPath = path.join(__dirname, '..', 'reports', `field-verification-${reportDate}.html`);

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Get all projects with mappings
    const projects = await sql`
      SELECT DISTINCT
        p.id,
        p.project_name,
        COUNT(DISTINCT m.sow_pole_number) as mapped_poles,
        COUNT(DISTINCT sp.pole_number) as total_sow_poles
      FROM projects p
      LEFT JOIN sow_onemap_mapping m ON p.id = m.project_id
      LEFT JOIN sow_poles sp ON p.id = sp.project_id
      GROUP BY p.id, p.project_name
      ORDER BY p.project_name
    `;

    // Start building HTML report
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Field Verification Report - ${reportDate}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .summary-card {
      padding: 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .summary-card.success {
      background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      color: #333;
    }
    .summary-card.warning {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .summary-card .subtitle {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #dee2e6;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .confidence-high {
      background: #d4edda;
      color: #155724;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .confidence-medium {
      background: #fff3cd;
      color: #856404;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .confidence-low {
      background: #f8d7da;
      color: #721c24;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .match-type {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .match-exact { background: #28a745; color: white; }
    .match-numeric { background: #17a2b8; color: white; }
    .match-proximity { background: #ffc107; color: #333; }
    .match-auto { background: #6c757d; color: white; }
    .action-required {
      background: #fff5f5;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .verification-needed {
      background: #fffbf0;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    @media print {
      .container { box-shadow: none; }
      .summary-card { break-inside: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 SOW Field Verification Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Purpose:</strong> Verify SOW pole mappings with field data for accuracy</p>
`;

    // Overall statistics
    const overallStats = await sql`
      SELECT
        COUNT(DISTINCT project_id) as total_projects,
        COUNT(*) as total_mappings,
        AVG(confidence_score) as avg_confidence,
        COUNT(DISTINCT sow_pole_number) as unique_sow_poles,
        COUNT(DISTINCT onemap_pole_number) as unique_onemap_poles
      FROM sow_onemap_mapping
    `;

    const stats = overallStats[0];

    html += `
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Projects</h3>
        <p class="value">${stats.total_projects || 0}</p>
        <p class="subtitle">With mappings</p>
      </div>
      <div class="summary-card success">
        <h3>Total Mappings</h3>
        <p class="value">${stats.total_mappings || 0}</p>
        <p class="subtitle">Pole connections found</p>
      </div>
      <div class="summary-card">
        <h3>Average Confidence</h3>
        <p class="value">${((stats.avg_confidence || 0) * 100).toFixed(0)}%</p>
        <p class="subtitle">Mapping accuracy</p>
      </div>
      <div class="summary-card warning">
        <h3>Unique Poles</h3>
        <p class="value">${stats.unique_sow_poles || 0}</p>
        <p class="subtitle">SOW poles mapped</p>
      </div>
    </div>
`;

    // Process each project
    for (const project of projects) {
      if (!project.mapped_poles || project.mapped_poles === 0) continue;

      html += `
    <h2>📋 ${project.project_name}</h2>
    <p><strong>Project ID:</strong> ${project.id}</p>
    <p><strong>Mapping Coverage:</strong> ${project.mapped_poles} of ${project.total_sow_poles || 0} poles (${project.total_sow_poles > 0 ? ((project.mapped_poles / project.total_sow_poles) * 100).toFixed(1) : 0}%)</p>
`;

      // Get high confidence matches for verification
      const highConfidence = await sql`
        SELECT
          sow_pole_number,
          onemap_pole_number,
          match_type,
          confidence_score,
          distance_meters
        FROM sow_onemap_mapping
        WHERE project_id = ${project.id}
          AND confidence_score >= 0.9
        ORDER BY confidence_score DESC
        LIMIT 10
      `;

      if (highConfidence.length > 0) {
        html += `
    <div class="verification-needed">
      <strong>✅ High Confidence Matches - Please Verify:</strong>
      <p>These poles have been automatically matched with high confidence. Field teams should verify these mappings are correct.</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>SOW Pole</th>
          <th>OneMap Field Pole</th>
          <th>Match Type</th>
          <th>Confidence</th>
          <th>Distance</th>
          <th>Field Verification</th>
        </tr>
      </thead>
      <tbody>
`;

        highConfidence.forEach(match => {
          const matchTypeClass = `match-${match.match_type.replace('_', '-')}`;
          const confidenceClass = match.confidence_score >= 0.9 ? 'confidence-high' :
                                 match.confidence_score >= 0.7 ? 'confidence-medium' : 'confidence-low';

          html += `
        <tr>
          <td><strong>${match.sow_pole_number}</strong></td>
          <td>${match.onemap_pole_number}</td>
          <td><span class="match-type ${matchTypeClass}">${match.match_type}</span></td>
          <td><span class="${confidenceClass}">${(match.confidence_score * 100).toFixed(0)}%</span></td>
          <td>${match.distance_meters ? `${match.distance_meters.toFixed(1)}m` : '-'}</td>
          <td>☐ Verified ☐ Incorrect</td>
        </tr>
`;
        });

        html += `
      </tbody>
    </table>
`;
      }

      // Get low confidence matches needing review
      const lowConfidence = await sql`
        SELECT
          sow_pole_number,
          onemap_pole_number,
          match_type,
          confidence_score,
          distance_meters
        FROM sow_onemap_mapping
        WHERE project_id = ${project.id}
          AND confidence_score < 0.7
        ORDER BY confidence_score ASC
        LIMIT 10
      `;

      if (lowConfidence.length > 0) {
        html += `
    <div class="action-required">
      <strong>⚠️ Low Confidence Matches - Action Required:</strong>
      <p>These matches have low confidence and require field verification to confirm or correct the mapping.</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>SOW Pole</th>
          <th>Possible Match</th>
          <th>Match Type</th>
          <th>Confidence</th>
          <th>Distance</th>
          <th>Field Action</th>
        </tr>
      </thead>
      <tbody>
`;

        lowConfidence.forEach(match => {
          html += `
        <tr>
          <td><strong>${match.sow_pole_number}</strong></td>
          <td>${match.onemap_pole_number}</td>
          <td><span class="match-type match-auto">${match.match_type}</span></td>
          <td><span class="confidence-low">${(match.confidence_score * 100).toFixed(0)}%</span></td>
          <td>${match.distance_meters ? `${match.distance_meters.toFixed(1)}m` : '-'}</td>
          <td>☐ Confirm ☐ Find Correct ☐ Not Found</td>
        </tr>
`;
        });

        html += `
      </tbody>
    </table>
`;
      }

      // Get unmapped SOW poles
      const unmappedPoles = await sql`
        SELECT
          pole_number,
          latitude,
          longitude,
          status
        FROM sow_poles
        WHERE project_id = ${project.id}
          AND pole_number NOT IN (
            SELECT sow_pole_number
            FROM sow_onemap_mapping
            WHERE project_id = ${project.id}
          )
        LIMIT 10
      `;

      if (unmappedPoles.length > 0) {
        html += `
    <div class="action-required">
      <strong>❌ Unmapped SOW Poles - Field Search Required:</strong>
      <p>These SOW poles could not be automatically matched. Field teams need to locate and map these poles.</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>SOW Pole Number</th>
          <th>GPS Coordinates</th>
          <th>Status</th>
          <th>Field Notes</th>
        </tr>
      </thead>
      <tbody>
`;

        unmappedPoles.forEach(pole => {
          const coords = pole.latitude && pole.longitude ?
            `${parseFloat(pole.latitude).toFixed(6)}, ${parseFloat(pole.longitude).toFixed(6)}` : 'No GPS';

          html += `
        <tr>
          <td><strong>${pole.pole_number}</strong></td>
          <td>${coords}</td>
          <td>${pole.status || 'Unknown'}</td>
          <td>_______________________</td>
        </tr>
`;
        });

        html += `
      </tbody>
    </table>
`;
      }
    }

    // Field verification checklist
    html += `
    <h2>📝 Field Verification Checklist</h2>
    <div class="verification-needed">
      <p><strong>For each pole mapping, field teams should verify:</strong></p>
      <ol>
        <li>☐ Physical pole number matches the records</li>
        <li>☐ GPS coordinates are accurate (within 10 meters)</li>
        <li>☐ Pole status matches field condition</li>
        <li>☐ Associated drops are correctly linked</li>
        <li>☐ Any damage or maintenance issues noted</li>
        <li>☐ Photos taken for documentation</li>
      </ol>
    </div>

    <h2>🔧 How to Submit Corrections</h2>
    <ol>
      <li><strong>Document Issues:</strong> Note any incorrect mappings with correct pole numbers</li>
      <li><strong>GPS Verification:</strong> Record accurate GPS coordinates for mislocated poles</li>
      <li><strong>Photo Evidence:</strong> Take clear photos of pole numbers and installations</li>
      <li><strong>Submit Report:</strong> Email corrections to project manager with this report marked up</li>
    </ol>

    <div class="footer">
      <p>Report generated by FibreFlow SOW Linking System</p>
      <p>For questions or support, contact the technical team</p>
    </div>
  </div>
</body>
</html>
`;

    // Save the report
    fs.writeFileSync(reportPath, html);
    console.log(`✅ Field verification report generated: ${reportPath}\n`);

    // Also generate a CSV for field teams
    const csvPath = path.join(reportsDir, `field-verification-${reportDate}.csv`);
    let csv = 'Project,SOW Pole,OneMap Pole,Match Type,Confidence,Distance (m),Verification Status\n';

    const allMappings = await sql`
      SELECT
        p.project_name,
        m.sow_pole_number,
        m.onemap_pole_number,
        m.match_type,
        m.confidence_score,
        m.distance_meters
      FROM sow_onemap_mapping m
      JOIN projects p ON m.project_id = p.id
      ORDER BY p.project_name, m.confidence_score DESC
    `;

    allMappings.forEach(row => {
      csv += `"${row.project_name}","${row.sow_pole_number}","${row.onemap_pole_number}","${row.match_type}",${(row.confidence_score * 100).toFixed(0)}%,${row.distance_meters || ''},\n`;
    });

    fs.writeFileSync(csvPath, csv);
    console.log(`✅ CSV export generated: ${csvPath}\n`);

    console.log('📊 Report Summary:');
    console.log(`  - Total mappings: ${stats.total_mappings || 0}`);
    console.log(`  - Average confidence: ${((stats.avg_confidence || 0) * 100).toFixed(0)}%`);
    console.log(`  - Projects covered: ${stats.total_projects || 0}`);
    console.log('\nReports are ready for field team verification!\n');

  } catch (error) {
    console.error('Error generating report:', error);
  }
}

// Run report generation
generateFieldVerificationReport();