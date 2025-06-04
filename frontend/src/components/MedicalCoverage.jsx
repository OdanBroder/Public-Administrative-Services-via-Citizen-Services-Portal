import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MedicalCoverage = () => {
  const { user, api, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [coverages, setCoverages] = useState([]);
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    citizenId: '',
    coverageType: '',
    startDate: '',
    endDate: '',
    monthlyPremium: '',
    serviceName: '',
    status: '',
    responseTime: '',
    uptime: ''
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [user, api, authLoading]);

  const fetchData = async () => {
    if (!user?.id || !api) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [coverageRes, serviceRes] = await Promise.all([
        api.get(`/medical-coverage/${user.id}`),
        api.get('/service-health')
      ]);
      setCoverages(coverageRes.data || []);
      setServices(serviceRes.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setCoverages([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpen = () => {
    if (!user?.id) {
      setError('Authentication required');
      return;
    }
    setFormData({
      citizenId: user.id,
      coverageType: '',
      startDate: '',
      endDate: '',
      monthlyPremium: '',
      serviceName: '',
      status: '',
      responseTime: '',
      uptime: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!api) {
      setError('Authentication required');
      return;
    }

    try {
      if (activeTab === 0) {
        await api.post('/medical-coverage', {
          citizenId: formData.citizenId,
          coverageType: formData.coverageType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          monthlyPremium: formData.monthlyPremium
        });
      } else {
        await api.post('/service-health', {
          serviceName: formData.serviceName,
          status: formData.status,
          responseTime: formData.responseTime,
          uptime: formData.uptime
        });
      }
      handleClose();
      fetchData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to submit form');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Please log in to access this page
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Medical Coverage & Service Health
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Medical Coverage" />
          <Tab label="Service Health" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add New {activeTab === 0 ? 'Coverage' : 'Service'}
        </Button>
      </Box>

      {activeTab === 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coverage Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Monthly Premium</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coverages.map((coverage) => (
                <TableRow key={coverage.id}>
                  <TableCell>{coverage.coverageType}</TableCell>
                  <TableCell>{new Date(coverage.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(coverage.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>${coverage.monthlyPremium}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Uptime</TableCell>
                <TableCell>Last Checked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.serviceName}</TableCell>
                  <TableCell>{service.status}</TableCell>
                  <TableCell>{service.responseTime}ms</TableCell>
                  <TableCell>{service.uptime}%</TableCell>
                  <TableCell>{new Date(service.lastChecked).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          Add New {activeTab === 0 ? 'Medical Coverage' : 'Service Health'}
        </DialogTitle>
        <DialogContent>
          {activeTab === 0 ? (
            <>
              <TextField
                select
                fullWidth
                margin="normal"
                name="coverageType"
                label="Coverage Type"
                value={formData.coverageType}
                onChange={handleChange}
                required
              >
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="Family">Family</MenuItem>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="monthlyPremium"
                label="Monthly Premium"
                type="number"
                value={formData.monthlyPremium}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <>
              <TextField
                fullWidth
                margin="normal"
                name="serviceName"
                label="Service Name"
                value={formData.serviceName}
                onChange={handleChange}
                required
              />
              <TextField
                select
                fullWidth
                margin="normal"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <MenuItem value="Operational">Operational</MenuItem>
                <MenuItem value="Degraded">Degraded</MenuItem>
                <MenuItem value="Down">Down</MenuItem>
              </TextField>
              <TextField
                fullWidth
                margin="normal"
                name="responseTime"
                label="Response Time (ms)"
                type="number"
                value={formData.responseTime}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                name="uptime"
                label="Uptime (%)"
                type="number"
                value={formData.uptime}
                onChange={handleChange}
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicalCoverage; 