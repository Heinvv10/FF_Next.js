# SOW API Endpoints Documentation

## Overview
After importing SOW data (Fibre, Poles, Drops) for a project, the data is accessible via these API endpoints.

## Base URL
`http://localhost:3005/api/sow`

## Project ID
**louissep15**: `e2a61399-275a-4c44-8008-e9e42b7a3501`

---

## 📊 Summary Endpoint

### GET `/api/sow/summary`
Returns aggregated statistics for all SOW data.

**Parameters:**
- `projectId` (required): Project UUID

**Example Request:**
```
GET http://localhost:3005/api/sow/summary?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501
```

**Response Structure:**
```json
{
  "poles": {
    "total": 4471,
    "withCoordinates": 4471,
    "withoutCoordinates": 0
  },
  "fibre": {
    "total": 681,
    "totalLength": 118472
  },
  "drops": {
    "total": 23707,
    "totalCableLength": 919145
  }
}
```

---

## 🔌 Fibre Endpoints

### GET `/api/sow/fibre`
Returns all fibre segments for a project.

**Parameters:**
- `projectId` (required): Project UUID
- `limit` (optional): Number of records to return
- `offset` (optional): Number of records to skip

**Example Request:**
```
GET http://localhost:3005/api/sow/fibre?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501
```

**Response Fields:**
- `segment_id`: Unique identifier for the segment
- `start_point`: Starting pole/location
- `end_point`: Ending pole/location
- `cable_type`: Type of cable (24F, 96F, 144F, 288F)
- `cable_length`: Length in meters
- `layer`: Network layer (Distribution, Secondary Feeder, Primary Feeder)
- `status`: Installation status
- `contractor`: Assigned contractor

**Stats for louissep15:**
- Total segments: 681
- Total cable length: 118,472 meters (118.47 km)
- Cable types: 24F (676), 96F (2), 144F (2), 288F (1)

---

## 📍 Poles Endpoints

### GET `/api/sow/poles`
Returns all poles for a project.

**Parameters:**
- `projectId` (required): Project UUID
- `limit` (optional): Number of records to return
- `offset` (optional): Number of records to skip

**Example Request:**
```
GET http://localhost:3005/api/sow/poles?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501
```

**Response Fields:**
- `pole_number`: Unique pole identifier (e.g., LAW.P.A001)
- `latitude`: GPS latitude coordinate
- `longitude`: GPS longitude coordinate
- `status`: Current status
- `pole_type`: Type of pole
- `height`: Pole height
- `owner`: Pole owner
- `address`: Physical address
- `municipality`: Municipality location

**Stats for louissep15:**
- Total poles: 4,471
- All have valid GPS coordinates
- Latitude range: -26.398388 to -26.368121
- Longitude range: 27.790069 to 27.819369

---

## 💧 Drops Endpoints

### GET `/api/sow/drops`
Returns all drop connections for a project.

**Parameters:**
- `projectId` (required): Project UUID
- `limit` (optional): Number of records to return
- `offset` (optional): Number of records to skip

**Example Request:**
```
GET http://localhost:3005/api/sow/drops?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501
```

**Response Fields:**
- `drop_number`: Unique drop identifier (e.g., DR1729500)
- `pole_number`: Associated pole
- `cable_type`: Type of drop cable
- `cable_length`: Length in meters
- `start_point`: Starting location (usually pole)
- `end_point`: Customer ONT location
- `status`: Installation status
- `address`: Service address

**Stats for louissep15:**
- Total drops: 23,707
- Total cable length: 919,145 meters (919.15 km)
- Average cable length: 38.77 meters
- References 2,965 unique poles

---

## 🔧 Additional Endpoints

### GET `/api/sow/list`
Returns paginated list of all SOW data with filtering options.

**Parameters:**
- `projectId` (required): Project UUID
- `type` (optional): Filter by type (poles, fibre, drops)
- `page` (optional): Page number
- `limit` (optional): Records per page

### GET `/api/sow/project`
Returns project-specific SOW configuration and metadata.

**Parameters:**
- `projectId` (required): Project UUID

### POST `/api/sow/import`
Endpoint for importing SOW data (used by import scripts).

**Parameters:**
- `projectId` (required): Project UUID
- `type` (required): Import type (poles, fibre, drops)
- `data` (required): Array of records to import

---

## Testing the Endpoints

### Using curl:
```bash
# Get summary
curl "http://localhost:3005/api/sow/summary?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501"

# Get first 10 poles
curl "http://localhost:3005/api/sow/poles?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501&limit=10"

# Get fibre segments
curl "http://localhost:3005/api/sow/fibre?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501"

# Get drops with pagination
curl "http://localhost:3005/api/sow/drops?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501&limit=100&offset=0"
```

### Using JavaScript/fetch:
```javascript
// Example: Fetch SOW summary
fetch('/api/sow/summary?projectId=e2a61399-275a-4c44-8008-e9e42b7a3501')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Database Tables

The API endpoints query these Neon PostgreSQL tables:
- `sow_poles` - Pole infrastructure data
- `sow_fibre` - Fibre cable segments
- `sow_drops` - Customer drop connections

All tables include:
- `project_id` - Links data to specific project
- `created_at` - Timestamp of record creation
- `updated_at` - Timestamp of last update
- `raw_data` - Original Excel data as JSON

---

## Notes

1. **Authentication**: Currently using AUTH_BYPASS=true in development
2. **Project Selection**: Must provide projectId parameter for all endpoints
3. **Data Format**: All endpoints return JSON
4. **Error Handling**: Returns appropriate HTTP status codes
   - 200: Success
   - 400: Bad request (missing parameters)
   - 404: Project or data not found
   - 500: Server error

## Import Scripts Using These APIs

The import scripts write directly to the database, but the APIs are used for:
- Verification after import
- UI data display (when implemented)
- Export functionality
- Reporting and analytics