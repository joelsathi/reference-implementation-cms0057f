import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Button, Card, TextField, IconButton, InputAdornment, Chip } from '@wso2/oxygen-ui';
import { ArrowLeft, Eye, EyeOff } from '@wso2/oxygen-ui-icons-react';
import { payersAPI } from '../api/payers';
import type { Payer, ErrorPayload } from '../api/payers';
import { DetailPageSkeleton } from '../components/LoadingSkeletons';

interface PayerData {
  id?: string;
  name: string;
  email: string;
  state: string;
  fhirServerUrl: string;
  appClientId: string;
  appClientSecret: string;
  tokenUrl: string;
  scopes: string | null;
}

// Transform API Payer to PayerData format
const transformPayer = (payer: Payer): PayerData => ({
  id: payer.id,
  name: payer.name,
  email: payer.email,
  state: payer.state || '',
  fhirServerUrl: payer.fhir_server_url,
  appClientId: payer.app_client_id,
  appClientSecret: payer.app_client_secret,
  tokenUrl: payer.token_url,
  scopes: payer.scopes || null,
});

export default function PayerDetail() {
  const navigate = useNavigate();
  const { payerId } = useParams<{ payerId: string }>();

  const [payer, setPayer] = useState<PayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState<PayerData>({
    name: '',
    email: '',
    state: '',
    fhirServerUrl: '',
    appClientId: '',
    appClientSecret: '',
    tokenUrl: '',
    scopes: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [scopeInput, setScopeInput] = useState('');
  const [scopeChips, setScopeChips] = useState<string[]>([]);

  // Fetch payer data on mount
  useEffect(() => {
    if (payerId) {
      fetchPayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payerId]);

  const fetchPayer = async () => {
    if (!payerId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await payersAPI.getPayer(payerId);
      const payerData = transformPayer(response);
      setPayer(payerData);
      setFormData(payerData);
      // Initialize scope chips
      const initialScopes = payerData.scopes ? payerData.scopes.split(',').map(s => s.trim()).filter(s => s) : [];
      setScopeChips(initialScopes);
    } catch (err) {
      const error = err as ErrorPayload;
      setError(error.message || 'Failed to fetch payer');
      console.error('Error fetching payer:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!payer) return false;
    const currentScopes = scopeChips.length > 0 ? scopeChips.join(',') : null;
    const originalScopes = payer.scopes || null;
    return (
      formData.name !== payer.name ||
      formData.email !== payer.email ||
      formData.state !== payer.state ||
      formData.fhirServerUrl !== payer.fhirServerUrl ||
      formData.appClientId !== payer.appClientId ||
      formData.appClientSecret !== payer.appClientSecret ||
      formData.tokenUrl !== payer.tokenUrl ||
      currentScopes !== originalScopes
    );
  }, [formData, payer, scopeChips]);

  // Show loading state
  if (loading) {
    return <DetailPageSkeleton />;
  }

  // Show error state
  if (error || !payer) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/manage/payers')}
          sx={{ mb: 3 }}
          variant="text"
        >
          Back to Payers
        </Button>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {error || 'Payer not found'}
        </Typography>
        {error && (
          <Button variant="outlined" onClick={fetchPayer}>
            Retry
          </Button>
        )}
      </Box>
    );
  }

  const handleChange = (field: keyof PayerData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleUpdate = async () => {
    if (!payerId) return;

    try {
      setUpdating(true);
      const scopesValue = scopeChips.length > 0 ? scopeChips.join(' ') : undefined;
      await payersAPI.updatePayer(payerId, {
        name: formData.name,
        email: formData.email,
        state: formData.state,
        fhir_server_url: formData.fhirServerUrl,
        app_client_id: formData.appClientId,
        app_client_secret: formData.appClientSecret,
        token_url: formData.tokenUrl,
        scopes: scopesValue,
      });
      
      // Refresh payer data
      await fetchPayer();
    } catch (err) {
      const error = err as ErrorPayload;
      alert(`Failed to update payer: ${error.message}`);
      console.error('Error updating payer:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (payer) {
      setFormData(payer);
      // Reset scope chips
      const initialScopes = payer.scopes ? payer.scopes.split(' ').filter(s => s.trim()) : [];
      setScopeChips(initialScopes);
      setScopeInput('');
    }
  };

  const handleScopeInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && scopeInput.trim()) {
      event.preventDefault();
      const newScope = scopeInput.trim();
      if (!scopeChips.includes(newScope)) {
        setScopeChips([...scopeChips, newScope]);
      }
      setScopeInput('');
    }
  };

  const handleDeleteScopeChip = (scopeToDelete: string) => {
    setScopeChips(scopeChips.filter(scope => scope !== scopeToDelete));
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/manage/payers')}
          sx={{ mb: 3 }}
          variant="text"
        >
          Back to Payers
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {/* Circle with Initial */}
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {getInitial(formData.name || payer.name)}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  mb: 0.5,
                }}
              >
                {payer.name}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {payer.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Information Card */}
      <Card sx={{ p: 4, mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 4,
          }}
        >
          Payer Details
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Payer Name"
              value={formData.name}
              onChange={handleChange('name')}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              required
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="State"
              value={formData.state}
              onChange={handleChange('state')}
              fullWidth
              required
            />
          </Box>
        </Box>
      </Card>

      {/* FHIR Configuration Card */}
      <Card sx={{ p: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 4,
          }}
        >
          FHIR Configuration
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="FHIR Server URL"
            value={formData.fhirServerUrl}
            onChange={handleChange('fhirServerUrl')}
            fullWidth
            required
          />
          <TextField
            label="Token URL"
            value={formData.tokenUrl}
            onChange={handleChange('tokenUrl')}
            fullWidth
            required
          />
          <TextField
            label="App Client ID"
            value={formData.appClientId}
            onChange={handleChange('appClientId')}
            fullWidth
            required
          />
          <TextField
            label="App Client Secret"
            value={formData.appClientSecret}
            onChange={handleChange('appClientSecret')}
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Scopes
            </Typography>
            <TextField
              value={scopeInput}
              onChange={(e) => setScopeInput(e.target.value)}
              onKeyDown={handleScopeInputKeyDown}
              fullWidth
              placeholder="Type scope and press Enter"
              size="small"
            />
            {scopeChips.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {scopeChips.map((scope) => (
                  <Chip
                    key={scope}
                    label={scope}
                    onDelete={() => handleDeleteScopeChip(scope)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        {hasChanges && (
          <Button
            variant="outlined"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={!hasChanges || updating}
        >
          {updating ? 'Updating...' : 'Update'}
        </Button>
      </Box>
    </Box>
  );
}
