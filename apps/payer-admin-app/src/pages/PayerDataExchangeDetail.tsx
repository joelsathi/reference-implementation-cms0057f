import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/useAuth';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  Alert,
} from '@wso2/oxygen-ui';
import {
  ArrowLeft,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@wso2/oxygen-ui-icons-react';
import { getPdexDataRequest, triggerDataExchange, type PdexDataRequest } from '../api/pdex';
import { getPatient, type PatientInfo } from '../api/fhir';
import { DetailPageSkeleton } from '../components/LoadingSkeletons';

export default function PayerDataExchangeDetail() {
  const navigate = useNavigate();
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<PdexDataRequest | null>(null);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!exchangeId) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await getPdexDataRequest(exchangeId);
        setData(response);
        
        // Fetch patient info from FHIR server
        if (response.patientId) {
          try {
            const patientInfo = await getPatient(response.patientId);
            setPatient(patientInfo);
          } catch (patientErr) {
            console.error('Failed to fetch patient info:', patientErr);
            // Don't set error state, just log it
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exchangeId]);

  const handleBack = () => {
    navigate('/payer-data-exchange');
  };

  const handleInitiate = async () => {
    if (!exchangeId) return;
    
    setTriggering(true);
    try {
      await triggerDataExchange(exchangeId);
      // Refresh data after triggering
      const response = await getPdexDataRequest(exchangeId);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger data exchange');
    } finally {
      setTriggering(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Redirect handled by AuthProvider
  if (!isAuthenticated) {
    return null;
  }

  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case 'In Progress':
        return {
          color: 'warning' as const,
          icon: <ClockIcon size={20} />,
          label: 'In Progress',
        };
      case 'Finished':
        return {
          color: 'success' as const,
          icon: <CheckCircleIcon size={20} />,
          label: 'Finished',
        };
      case 'Error':
        return {
          color: 'error' as const,
          icon: <XCircleIcon size={20} />,
          label: 'Error',
        };
      case 'Initiate':
      default:
        return {
          color: 'default' as const,
          icon: <ClockIcon size={20} />,
          label: 'Not Initiated',
        };
    }
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowLeft size={20} />}
          onClick={handleBack}
          sx={{ mb: 3 }}
          variant="text"
        >
          Back to Data Exchanges
        </Button>
        <Alert severity="error">
          {error || 'Failed to load data exchange details'}
        </Alert>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(data.syncStatus);

  return (
    <Box sx={{ p: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={handleBack}
        sx={{ mb: 3 }}
        variant="text"
      >
        Back to Data Exchanges
      </Button>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Data Exchange Details
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Exchange ID: {exchangeId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Consent Status
            </Typography>
            <Chip
              label={data.consent}
              color={
                data.consent === 'GRANTED' ? 'success' :
                data.consent === 'DENIED' ? 'error' :
                'warning'
              }
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Sync Status
            </Typography>
            <Chip
              icon={statusConfig?.icon}
              label={statusConfig?.label}
              color={statusConfig?.color}
              sx={{ fontWeight: 600, px: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Patient Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Patient Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {patient?.name || 'Loading...'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Date of Birth
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {patient?.dateOfBirth || 'Loading...'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Member ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {patient?.memberId || data.patientId || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Email
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {patient?.email || 'Loading...'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Phone
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {patient?.phone || 'Loading...'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Payer Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Previous Payer Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Payer Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.payerName || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Payer ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.payerId || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                State
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.oldPayerState || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Coverage ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.oldCoverageId || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Coverage Start Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.coverageStartDate || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                Coverage End Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {data.coverageEndDate || 'N/A'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Initiate Button */}
      {data.syncStatus === 'Initiate' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleInitiate}
            disabled={data.consent !== 'GRANTED' || triggering}
          >
            {triggering ? 'Initiating...' : 'Initiate Data Exchange'}
          </Button>
          {data.consent !== 'GRANTED' && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
              Patient consent is required to initiate data exchange
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
