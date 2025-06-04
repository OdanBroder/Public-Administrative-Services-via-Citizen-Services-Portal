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
  CircularProgress,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  const [editingService, setEditingService] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
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

    // Set initial tab based on user role
    if (user.role === 'admin') {
      setActiveTab(1); // Service Health tab
    } else {
      setActiveTab(0); // Medical Coverage tab
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

  const handleOpen = (service = null) => {
    if (!user?.id) {
      setError('Authentication required');
      return;
    }

    if (service) {
      setEditingService(service);
      setFormData({
        ...formData,
        serviceName: service.serviceName,
        status: service.status,
        responseTime: service.responseTime,
        uptime: service.uptime
      });
    } else {
      setEditingService(null);
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
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setEditingService(null);
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
        if (editingService) {
          await api.put(`/service-health/${editingService.id}`, {
            status: formData.status,
            responseTime: formData.responseTime,
            uptime: formData.uptime
          });
        } else {
          await api.post('/service-health', {
            serviceName: formData.serviceName,
            status: formData.status,
            responseTime: formData.responseTime,
            uptime: formData.uptime
          });
        }
      }
      handleClose();
      fetchData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to submit form');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!api) {
      setError('Authentication required');
      return;
    }

    try {
      await api.delete(`/service-health/${serviceId}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting service:', err);
      setError(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const handleRegisterService = async (serviceId) => {
    if (!api) {
      setError('Authentication required');
      return;
    }

    try {
      const response = await api.post('/applications', {
        user_id: user.id,
        service_id: serviceId,
        service_type: 'MEDICAL_SERVICE'
      });

      setSuccessMessage(`Successfully registered for ${response.data.application.Service.name}. Your application is pending approval.`);
      setError('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      console.error('Error registering for service:', err);
      setError(err.response?.data?.message || 'Failed to register for service');
      setSuccessMessage('');
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
        {user.role === 'admin' ? 'Service Health Management' : 'Medical Coverage & Services'}
      </Typography>

      {user.role !== 'admin' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Medical Coverage" />
            <Tab label="Available Services" />
          </Tabs>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {user.role === 'admin' ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" color="primary" onClick={() => handleOpen()}>
              Add New Service
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Last Checked</TableCell>
                  <TableCell>Actions</TableCell>
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
                    <TableCell>
                      <IconButton onClick={() => handleOpen(service)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(service.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          {activeTab === 0 ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Button variant="contained" color="primary" onClick={() => handleOpen()}>
                  Add New Coverage
                </Button>
              </Box>

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
            </>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Service Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.serviceName}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: service.status === 'UP' ? 'success.light' :
                              service.status === 'DEGRADED' ? 'warning.light' : 'error.light',
                            color: 'white'
                          }}
                        >
                          {service.status}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleRegisterService(service.id)}
                          disabled={service.status !== 'UP'}
                        >
                          Register
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {user.role === 'admin'
            ? (editingService ? 'Edit Service Health' : 'Add New Service Health')
            : 'Add New Medical Coverage'}
        </DialogTitle>
        <DialogContent>
          {user.role === 'admin' ? (
            <>
              {!editingService && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="serviceName"
                  label="Service Name"
                  value={formData.serviceName}
                  onChange={handleChange}
                  required
                />
              )}
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
                <MenuItem value="UP">Operational</MenuItem>
                <MenuItem value="DEGRADED">Degraded</MenuItem>
                <MenuItem value="DOWN">Down</MenuItem>
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
          ) : (
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
                <MenuItem value="BASIC">Basic</MenuItem>
                <MenuItem value="STANDARD">Standard</MenuItem>
                <MenuItem value="PREMIUM">Premium</MenuItem>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingService ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicalCoverage; 