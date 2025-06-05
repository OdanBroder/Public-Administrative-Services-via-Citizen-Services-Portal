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
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MedicalCoverage = () => {
  const { user, role, api, loading: authLoading } = useAuth();
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
  const isAdmin = role === "Admin";

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Default tab settings - both user and admin start with tab 0
    setActiveTab(0);
    
    fetchData();
  }, [user, role, api, authLoading]);

  const fetchData = async () => {
    if (!user?.id || !api) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Both user types need service health data
      const serviceRes = await api.get('/service-health');
      setServices(serviceRes.data || []);
      
      // Fetch medical coverage
      try {
        // For admin/staff, fetch all coverage
        // For regular users, fetch only their coverage
        const coverageRes = await api.get(`/medical-coverage/${isAdmin ? 'all' : user.id}`);
        setCoverages(coverageRes.data || []);
      } catch (err) {
        console.error('Error fetching coverage data:', err);
        setCoverages([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reload data when switching tabs to ensure fresh data
    fetchData();
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
        responseTime: service.responseTime || 0,
        uptime: service.uptime || 0
      });
    } else {
      setEditingService(null);
      setFormData({
        citizenId: isAdmin ? '' : user.id,
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

      setSuccessMessage(`Successfully registered for service. Your application is pending approval.`);
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
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          padding: '8px 12px',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        {role === 'Admin' ? 'Service Portal Administration' : 'Medical Coverage & Services'}
      </Typography>

      {/* Tab navigation for both admin and regular users */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {/* Both users and admins can see Medical Coverage tab */}
          <Tab label="Medical Coverage" />
          
          {/* Both users and admins can see Available Services tab */}
          <Tab label={isAdmin ? "Service Health Management" : "Available Services"} />
        </Tabs>
      </Box>

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

      {activeTab === 0 ? (
        // Medical Coverage Tab - for both user and admin
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
                  {isAdmin && (
                    <>
                      <TableCell>User ID</TableCell>
                      <TableCell>User Name</TableCell>
                      <TableCell>User Email</TableCell>
                    </>
                  )}
                  <TableCell>Coverage Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Monthly Premium</TableCell>
                  <TableCell>Status</TableCell>
                  {isAdmin && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {coverages && coverages.length > 0 ? (
                  coverages.map((coverage) => (
                    <TableRow key={coverage.id}>
                      {isAdmin && (
                        <>
                          <TableCell>{coverage.user?.id}</TableCell>
                          <TableCell>{`${coverage.user?.firstName} ${coverage.user?.lastName}`}</TableCell>
                          <TableCell>{coverage.user?.email}</TableCell>
                        </>
                      )}
                      <TableCell>{coverage.type}</TableCell>
                      <TableCell>{new Date(coverage.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(coverage.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>${coverage.monthlyPremium}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: coverage.status === 'ACTIVE' ? 'success.light' : 'error.light',
                            color: 'white'
                          }}
                        >
                          {coverage.status}
                        </Box>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <IconButton onClick={() => handleOpen(coverage)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(coverage.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 5} align="center">
                      No coverage found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        // Service Health Tab - Different for admin vs user
        isAdmin ? (
          <>
            {/* Admin view for service health */}
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
                  {services && services.length > 0 ? (
                    services.map((service) => (
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
                        <TableCell>{service.responseTime || 'N/A'}ms</TableCell>
                        <TableCell>{service.uptime || 'N/A'}%</TableCell>
                        <TableCell>{service.lastChecked ? new Date(service.lastChecked).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpen(service)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(service.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No services found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            {/* User view for available services */}
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
                  {services && services.length > 0 ? (
                    services.map((service) => (
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No services available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {activeTab === 0 ? 'Add New Medical Coverage' : 
            (editingService ? 'Edit Service Health' : 'Add New Service Health')}
        </DialogTitle>
        <DialogContent>
          {activeTab === 0 ? (
            // Medical Coverage Form
            <Box component="form" sx={{ mt: 2 }}>
              {isAdmin && (
                <TextField
                  fullWidth
                  label="User ID"
                  name="citizenId"
                  value={formData.citizenId}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              )}
              <TextField
                fullWidth
                label="Coverage Type"
                name="coverageType"
                value={formData.coverageType}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Monthly Premium"
                name="monthlyPremium"
                type="number"
                value={formData.monthlyPremium}
                onChange={handleChange}
                margin="normal"
                required
              />
            </Box>
          ) : (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingService ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MedicalCoverage;