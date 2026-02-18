import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormLabel,
  Chip,
} from '@wso2/oxygen-ui';
import { X } from '@wso2/oxygen-ui-icons-react';

// Custom styles for red asterisk
const requiredLabelStyles = {
  '& .MuiFormLabel-asterisk': {
    color: 'error.main',
  },
};

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

interface PayerModalProps {
  open: boolean;
  onClose: () => void;
  payer?: PayerData;
  onSave: (payer: PayerData) => void;
}

export default function PayerModal({ open, onClose, payer, onSave }: PayerModalProps) {
  const getInitialFormData = (): PayerData => {
    if (payer) {
      return payer;
    }
    return {
      name: '',
      email: '',
      state: '',
      fhirServerUrl: '',
      appClientId: '',
      appClientSecret: '',
      tokenUrl: '',
      scopes: null,
    };
  };

  const [formData, setFormData] = useState<PayerData>(getInitialFormData());
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [scopeInput, setScopeInput] = useState('');
  const [scopeChips, setScopeChips] = useState<string[]>([]);
  
  const steps = ['Basic Information', 'FHIR Configuration'];

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
      setActiveStep(0);
      setErrors({});
      // Initialize scope chips from formData
      const initialScopes = payer?.scopes ? payer.scopes.split(' ').filter(s => s.trim()) : [];
      setScopeChips(initialScopes);
      setScopeInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payer]);

  const handleChange = (field: keyof PayerData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    const newErrors: Record<string, boolean> = {};
    
    if (activeStep === 0) {
      // Validate Basic Information step
      if (!formData.name.trim()) newErrors.name = true;
      if (!formData.email.trim()) newErrors.email = true;
    } else if (activeStep === 1) {
      // Validate FHIR Configuration step
      if (!formData.fhirServerUrl.trim()) newErrors.fhirServerUrl = true;
      if (!formData.appClientId.trim()) newErrors.appClientId = true;
      if (!formData.appClientSecret.trim()) newErrors.appClientSecret = true;
      if (!formData.tokenUrl.trim()) newErrors.tokenUrl = true;
    }
    
    setErrors(newErrors);
    
    // Only proceed if there are no errors
    if (Object.keys(newErrors).length === 0) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    // Convert scope chips to string before saving
    const dataToSave = {
      ...formData,
      scopes: scopeChips.length > 0 ? scopeChips.join(' ') : null,
    };
    onSave(dataToSave);
    onClose();
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

  const isEditMode = Boolean(payer);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                Name
              </FormLabel>
              <TextField
                value={formData.name}
                onChange={handleChange('name')}
                fullWidth
                placeholder="Enter payer name"
                size="small"
                error={errors.name}
              />
            </Box>

            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                Email
              </FormLabel>
              <TextField
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                fullWidth
                placeholder="Enter email address"
                size="small"
                error={errors.email}
              />
            </Box>

            <Box>
              <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
                State
              </FormLabel>
              <TextField
                value={formData.state}
                onChange={handleChange('state')}
                fullWidth
                placeholder="Enter state"
                size="small"
              />
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                FHIR Server URL
              </FormLabel>
              <TextField
                value={formData.fhirServerUrl}
                onChange={handleChange('fhirServerUrl')}
                fullWidth
                placeholder="https://example.com/fhir"
                size="small"
                error={errors.fhirServerUrl}
              />
            </Box>

            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                Token URL
              </FormLabel>
              <TextField
                value={formData.tokenUrl}
                onChange={handleChange('tokenUrl')}
                fullWidth
                placeholder="https://example.com/oauth/token"
                size="small"
                error={errors.tokenUrl}
              />
            </Box>

            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                App Client ID
              </FormLabel>
              <TextField
                value={formData.appClientId}
                onChange={handleChange('appClientId')}
                fullWidth
                placeholder="Enter client ID"
                size="small"
                error={errors.appClientId}
              />
            </Box>

            <Box>
              <FormLabel required sx={{ mb: 1, display: 'block', fontWeight: 500, ...requiredLabelStyles }}>
                App Client Secret
              </FormLabel>
              <TextField
                type="password"
                value={formData.appClientSecret}
                onChange={handleChange('appClientSecret')}
                fullWidth
                placeholder="Enter client secret"
                size="small"
                error={errors.appClientSecret}
              />
            </Box>

            <Box>
              <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
                Scopes
              </FormLabel>
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
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="payer-modal-title"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            p: 3,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box>
            <Typography id="payer-modal-title" variant="h5" sx={{ fontWeight: 600 }}>
              Connect a Payer
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Onboard the payers with your organization
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X />
          </IconButton>
        </Box>

        {/* Stepper */}
        <Box sx={{ px: 3, pt: 3, display: 'flex', justifyContent: 'center' }}>
          <Stepper 
            activeStep={activeStep}
            sx={{
              '& .MuiStepLabel-root': {
                flexDirection: 'column',
                alignItems: 'center',
              },
              '& .MuiStepLabel-iconContainer': {
                paddingRight: 0,
                marginBottom: 0.5,
              },
              '& .MuiStepIcon-root': {
                fontSize: '2rem',
              },
              '& .MuiStepIcon-text': {
                fontSize: '1rem',
              },
              '& .MuiStepLabel-labelContainer': {
                textAlign: 'center',
              },
              '& .MuiStepConnector-root': {
                flex: '0 0 40px',
              },
              '& .MuiStepConnector-line': {
                borderStyle: 'dashed',
                borderWidth: 1
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Box sx={{ p: 3, height: 400, overflow: 'auto' }}>
          {renderStepContent(activeStep)}
        </Box>

        {/* Action Buttons */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            gap: 2, 
            p: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default'
          }}
        >
          <Button 
            variant="text" 
            onClick={activeStep === 0 ? onClose : handleBack}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmit}>
              {isEditMode ? 'Update' : 'Connect'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
