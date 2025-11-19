'use client';

import { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Tab, Tabs, Paper, Typography, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Grid3X3, Cable, MapPin, Link } from 'lucide-react';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function ImportsDataGridPage() {
  const [tabValue, setTabValue] = useState(0);
  const [projectId, setProjectId] = useState('e2a61399-275a-4c44-8008-e9e42b7a3501');
  const [projects, setProjects] = useState([
    { id: 'e2a61399-275a-4c44-8008-e9e42b7a3501', name: 'louissep15' },
    { id: '7e7a6d88-8da1-4ac3-a16e-4b7a91e83439', name: 'louisProjectTestWed' }
  ]);
  const [polesData, setPolesData] = useState([]);
  const [fibreData, setFibreData] = useState([]);
  const [dropsData, setDropsData] = useState([]);
  const [onemapData, setOnemapData] = useState([]);
  const [nokiaData, setNokiaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkingStats, setLinkingStats] = useState<any>(null);
  const [matchingMode, setMatchingMode] = useState('enhanced');

  // Fetch data when project changes
  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId, matchingMode]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [polesRes, fibreRes, dropsRes, onemapRes, nokiaRes] = await Promise.all([
        fetch(`/api/sow/poles?projectId=${projectId}`),
        fetch(`/api/sow/fibre?projectId=${projectId}`),
        fetch(`/api/sow/drops?projectId=${projectId}`),
        fetch(`/api/onemap/properties-enhanced?projectId=${projectId}&matchingMode=${matchingMode}`),
        fetch(`/api/nokia/velocity?projectId=${projectId}`)
      ]);

      const [poles, fibre, drops, onemap, nokia] = await Promise.all([
        polesRes.json(),
        fibreRes.json(),
        dropsRes.json(),
        onemapRes.ok ? onemapRes.json() : { data: [] },
        nokiaRes.ok ? nokiaRes.json() : { data: [] }
      ]);

      setPolesData(poles.data || []);
      setFibreData(fibre.data || []);
      setDropsData(drops.data || []);
      setOnemapData(onemap.data || []);
      setNokiaData(nokia.data || []);
      setLinkingStats(onemap.stats || null);

      // Show linking statistics
      if (onemap.stats) {
        const msg = `Loaded ${onemap.stats.total} records: ${onemap.stats.linked} linked (${onemap.stats.linkingRate}%)`;
        toast.success(msg);
      } else {
        toast.success('Import data loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load import data');
    } finally {
      setLoading(false);
    }
  };

  // Column definitions for Poles
  const polesColumns: GridColDef[] = [
    { field: 'pole_number', headerName: 'Pole Number', width: 150 },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 120,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : 'N/A'
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 120,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : 'N/A'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Unknown'}
          color={params.value === 'approved' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    { field: 'address', headerName: 'Address', width: 250 },
    { field: 'municipality', headerName: 'Municipality', width: 150 },
    { field: 'owner', headerName: 'Owner', width: 150 },
    { field: 'height', headerName: 'Height', width: 100 },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null
    }
  ];

  // Column definitions for Fibre
  const fibreColumns: GridColDef[] = [
    { field: 'segment_id', headerName: 'Segment ID', width: 150 },
    { field: 'start_point', headerName: 'Start Point', width: 150 },
    { field: 'end_point', headerName: 'End Point', width: 150 },
    { field: 'cable_type', headerName: 'Cable Type', width: 120 },
    {
      field: 'cable_length',
      headerName: 'Length (m)',
      width: 120,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(2) : '0'
    },
    { field: 'layer', headerName: 'Layer', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'planned'}
          color={params.value === 'completed' ? 'success' : 'primary'}
          size="small"
        />
      )
    },
    { field: 'contractor', headerName: 'Contractor', width: 150 },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null
    }
  ];

  // Column definitions for Drops
  const dropsColumns: GridColDef[] = [
    { field: 'drop_number', headerName: 'Drop Number', width: 150 },
    { field: 'pole_number', headerName: 'Pole Number', width: 150 },
    { field: 'start_point', headerName: 'Start Point', width: 150 },
    { field: 'end_point', headerName: 'End Point (ONT)', width: 200 },
    {
      field: 'cable_length',
      headerName: 'Length (m)',
      width: 120,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(2) : '0'
    },
    { field: 'cable_type', headerName: 'Cable Type', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'planned'}
          color={params.value === 'active' ? 'success' : 'info'}
          size="small"
        />
      )
    },
    { field: 'address', headerName: 'Address', width: 250 },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null
    }
  ];

  // Column definitions for OneMap Field Data
  const onemapColumns: GridColDef[] = [
    { field: 'property_id', headerName: 'Property ID', width: 150 },
    { field: 'onemap_id', headerName: 'OneMap ID', width: 150 },
    { field: 'location_address', headerName: 'Address', width: 250 },
    { field: 'pole_number', headerName: 'Pole #', width: 100 },
    { field: 'drop_number', headerName: 'Drop #', width: 100 },
    {
      field: 'status',
      headerName: 'Field Status',
      width: 150,
      renderCell: (params) => {
        const status = params.value || 'unknown';
        let color: any = 'default';
        if (status.includes('Approved')) color = 'success';
        else if (status.includes('Complete')) color = 'success';
        else if (status.includes('Installed')) color = 'info';
        else if (status.includes('Survey')) color = 'warning';
        return (
          <Chip
            label={status}
            color={color}
            size="small"
          />
        );
      }
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 110,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : ''
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 110,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : ''
    },
    { field: 'contact_name', headerName: 'Contact Name', width: 120 },
    { field: 'contact_surname', headerName: 'Surname', width: 120 },
    { field: 'contact_number', headerName: 'Phone', width: 120 },
    {
      field: 'sow_pole_number',
      headerName: 'Linked SOW',
      width: 120,
      renderCell: (params) => {
        if (params.value) {
          const matchType = params.row.match_type || 'exact';
          const labels = {
            exact: '✓ Exact',
            normalized: '✓ Normalized',
            proximity: '✓ Proximity'
          };
          const colors = {
            exact: 'success',
            normalized: 'info',
            proximity: 'warning'
          };
          return (
            <Chip
              label={labels[matchType] || '✓ Linked'}
              color={colors[matchType] || 'success'}
              size="small"
            />
          );
        }
        return <Chip label="Not Linked" variant="outlined" size="small" />;
      }
    },
    {
      field: 'match_type',
      headerName: 'Match Type',
      width: 100,
      renderCell: (params) => {
        if (!params.value) return '-';
        return (
          <Typography variant="caption" color="textSecondary">
            {params.value}
          </Typography>
        );
      }
    },
    {
      field: 'drop_cable_length',
      headerName: 'Drop Cable (m)',
      width: 120,
      valueFormatter: (value) => value || ''
    },
    {
      field: 'home_signup_date',
      headerName: 'Signup Date',
      width: 150,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null
    }
  ];

  // Column definitions for Nokia Velocity (Focus on Drops)
  const nokiaColumns: GridColDef[] = [
    { field: 'drop_number', headerName: 'Drop Number', width: 150 },
    { field: 'property_id', headerName: 'Property ID', width: 120 },
    {
      field: 'ont_barcode',
      headerName: 'ONT Barcode',
      width: 150,
      renderCell: (params) => params.value ? (
        <Chip label={params.value} color="success" size="small" />
      ) : <Chip label="Not Installed" variant="outlined" size="small" />
    },
    {
      field: 'status',
      headerName: 'Installation Status',
      width: 250,
      renderCell: (params) => {
        const status = params.value || 'Unknown';
        let color: 'success' | 'warning' | 'info' | 'default' = 'default';
        if (status.includes('Installed')) color = 'success';
        else if (status.includes('In Progress')) color = 'warning';
        else if (status.includes('Approved')) color = 'info';
        return <Chip label={status} color={color} size="small" />;
      }
    },
    { field: 'pole_number', headerName: 'Pole Number', width: 120 },
    { field: 'stand_number', headerName: 'Stand Number', width: 120 },
    {
      field: 'installation_date',
      headerName: 'Install Date',
      width: 130,
      type: 'date',
      valueGetter: (value) => value ? new Date(value) : null
    },
    {
      field: 'latitude',
      headerName: 'Latitude',
      width: 110,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : ''
    },
    {
      field: 'longitude',
      headerName: 'Longitude',
      width: 110,
      valueFormatter: (value) => value ? parseFloat(value).toFixed(6) : ''
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Grid3X3 className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Imports Data Grid</h1>
            <p className="text-gray-600">View SOW and OneMap field data imports</p>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Matching Mode Selector */}
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Matching Mode</InputLabel>
            <Select
              value={matchingMode}
              label="Matching Mode"
              onChange={(e) => setMatchingMode(e.target.value)}
            >
              <MenuItem value="enhanced">Enhanced (Smart)</MenuItem>
              <MenuItem value="exact">Exact Only</MenuItem>
            </Select>
          </FormControl>

          {/* Project Selector */}
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={projectId}
              label="Select Project"
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Linking Stats Alert */}
      {linkingStats && (
        <Paper className="p-4 mb-4 bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6" color="primary">
                SOW Linking Status
              </Typography>
              <Typography variant="body2" className="mt-1">
                {linkingStats.linked} of {linkingStats.total} OneMap records linked ({linkingStats.linkingRate}%)
                {linkingStats.matchTypes && (
                  <span className="ml-2">
                    | Exact: {linkingStats.matchTypes.exact || 0}
                    | Normalized: {linkingStats.matchTypes.normalized || 0}
                    | Proximity: {linkingStats.matchTypes.proximity || 0}
                  </span>
                )}
              </Typography>
            </div>
            <Link className="h-8 w-8 text-blue-500" />
          </div>
        </Paper>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Paper className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6">{polesData.length}</Typography>
              <Typography variant="body2" color="textSecondary">SOW Poles</Typography>
            </div>
            <MapPin className="h-8 w-8 text-orange-500" />
          </div>
        </Paper>
        <Paper className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6">{fibreData.length}</Typography>
              <Typography variant="body2" color="textSecondary">Fibre Segments</Typography>
            </div>
            <Cable className="h-8 w-8 text-blue-500" />
          </div>
        </Paper>
        <Paper className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6">{dropsData.length}</Typography>
              <Typography variant="body2" color="textSecondary">SOW Drops</Typography>
            </div>
            <Link className="h-8 w-8 text-green-500" />
          </div>
        </Paper>
        <Paper className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6">{onemapData.length}</Typography>
              <Typography variant="body2" color="textSecondary">OneMap Records</Typography>
            </div>
            <Grid3X3 className="h-8 w-8 text-purple-500" />
          </div>
        </Paper>
        <Paper className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6">{nokiaData.length}</Typography>
              <Typography variant="body2" color="textSecondary">Nokia Drops</Typography>
            </div>
            <Cable className="h-8 w-8 text-red-500" />
          </div>
        </Paper>
      </div>

      {/* Tabs */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`SOW Poles (${polesData.length})`} />
            <Tab label={`Fibre (${fibreData.length})`} />
            <Tab label={`SOW Drops (${dropsData.length})`} />
            <Tab label={`OneMap Field (${onemapData.length})`} />
            <Tab label={`Nokia Drops (${nokiaData.length})`} />
          </Tabs>
        </Box>

        {/* Poles Grid */}
        <TabPanel value={tabValue} index={0}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={polesData}
              columns={polesColumns}
              pageSize={50}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row.id || row.pole_number}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </div>
        </TabPanel>

        {/* Fibre Grid */}
        <TabPanel value={tabValue} index={1}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={fibreData}
              columns={fibreColumns}
              pageSize={50}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row.id || row.segment_id}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </div>
        </TabPanel>

        {/* Drops Grid */}
        <TabPanel value={tabValue} index={2}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={dropsData}
              columns={dropsColumns}
              pageSize={50}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row.id || row.drop_number}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </div>
        </TabPanel>

        {/* OneMap Field Data Grid */}
        <TabPanel value={tabValue} index={3}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={onemapData}
              columns={onemapColumns}
              pageSize={50}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row.id || row.property_id}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </div>
        </TabPanel>

        {/* Nokia Drops Grid */}
        <TabPanel value={tabValue} index={4}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={nokiaData}
              columns={nokiaColumns}
              pageSize={50}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row.id || `${row.property_id}_${row.drop_number}`}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
            />
          </div>
        </TabPanel>
      </Paper>
    </div>
  );
}