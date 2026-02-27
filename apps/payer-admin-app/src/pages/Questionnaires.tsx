import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Pagination,
} from '@wso2/oxygen-ui';
import { Plus, Search, UploadIcon, Sparkles } from '@wso2/oxygen-ui-icons-react';
import QuestionnaireCard from '../components/QuestionnaireCard';
import LoadingCardSkeleton from '../components/LoadingCardSkeleton';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { generateUUID } from '../types/questionnaire';
import botIcon from '../assets/images/bot-icon.png';
import { questionnairesAPI, type QuestionnaireListItem } from '../api/questionnaires';
import { useAuth } from '../components/useAuth';

export default function Questionnaires() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiGenerateDialogOpen, setAiGenerateDialogOpen] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionnaireToDelete, setQuestionnaireToDelete] = useState<QuestionnaireListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch questionnaires from API
  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        setIsLoading(true);
        const response = await questionnairesAPI.getQuestionnaires({
          search: searchQuery || undefined,
          page: currentPage,
          limit: 9,
        });
        setQuestionnaires(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Error fetching questionnaires:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load questionnaires. Please try again.',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [searchQuery, currentPage]);

  const handleCreateQuestionnaire = () => {
    // Generate a random UUID for the new questionnaire
    const newId = generateUUID();
    navigate(`/questionnaires/${newId}`, { state: { isNew: true } });
  };

  const handleViewQuestionnaire = (questionnaire: QuestionnaireListItem) => {
    navigate(`/questionnaires/${questionnaire.id}`);
  };

  const handleDeleteQuestionnaire = (questionnaire: QuestionnaireListItem) => {
    setQuestionnaireToDelete(questionnaire);
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuestionnaire = async () => {
    if (!questionnaireToDelete) return;

    try {
      setIsDeleting(true);
      await questionnairesAPI.deleteQuestionnaire(questionnaireToDelete.id);
      setQuestionnaires(questionnaires.filter(q => q.id !== questionnaireToDelete.id));
      setSnackbar({
        open: true,
        message: 'Questionnaire deleted successfully.',
        severity: 'success',
      });
      setDeleteModalOpen(false);
      setQuestionnaireToDelete(null);
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete questionnaire. Please try again.',
        severity: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
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

  const processingSteps = [
    'Processing PDF',
    'Pre-processing data',
    'Extracting scenarios',
    'Creating Questionnaires',
    'Evaluating Questionnaires',
  ];

  const handlePdfFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedPdfFile(file);
    } else if (file) {
      setSnackbar({
        open: true,
        message: 'Please select a valid PDF file.',
        severity: 'error',
      });
    }
  };

  const handleGenerateWithAI = async () => {
    if (!selectedPdfFile) {
      setSnackbar({
        open: true,
        message: 'Please upload a PDF file first.',
        severity: 'warning',
      });
      return;
    }

    // Close dialog and start processing
    setAiGenerateDialogOpen(false);
    setIsProcessing(true);
    setProcessingStep(0);

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds per step
    }

    // TODO: Replace with actual API call to process PDF and generate questionnaire
    setIsProcessing(false);
    setSnackbar({
      open: true,
      message: 'Questionnaire generated successfully from PDF!',
      severity: 'success',
    });
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header with Add Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 500,
              letterSpacing: '-0.02em',
              mb: 1
            }}
          >
            Questionnaires
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.tertiary',
              maxWidth: 600,
              lineHeight: 1.6
            }}
          >
            Manage pre-authorization questionnaires for various medical procedures and services.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Sparkles size={18} />}
            onClick={() => setAiGenerateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
              },
            }}
          >
            Generate with AI
          </Button>
          <Button
            variant="outlined"
            startIcon={
              <Plus 
                size={18} 
                strokeWidth={3}
                style={{ fontWeight: 'bold' }}
              />
            }
            onClick={handleCreateQuestionnaire}
          >
            Create Questionnaire
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          placeholder="Search questionnaires by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: <Search style={{ marginRight: 8 }} />,
            },
          }}
        />
      </Box>

      {/* Processing Steps Indicator */}
      {isProcessing && (
        <Box sx={{ mb: 3, p: 3, bgcolor: 'action.hover', borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {processingSteps[processingStep]}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(processingStep + 1) / processingSteps.length * 100} 
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {processingSteps.map((step, index) => (
              <Box
                key={step}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  bgcolor: index < processingStep ? 'success.main' : index === processingStep ? 'primary.main' : 'action.selected',
                  color: index <= processingStep ? 'white' : 'text.secondary',
                  transition: 'all 0.3s ease',
                }}
              >
                {index < processingStep && '✓ '}{step}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Questionnaire Cards Grid */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {isLoading ? (
          // Show skeleton loading cards
          <>
            <LoadingCardSkeleton />
            <LoadingCardSkeleton />
            <LoadingCardSkeleton />
            <LoadingCardSkeleton />
          </>
        ) : (
          <>
            {questionnaires.map((questionnaire) => (
              <QuestionnaireCard
                key={questionnaire.id}
                id={questionnaire.id}
                name={questionnaire.title}
                description={questionnaire.description || ''}
                status={questionnaire.status}
                onClick={() => handleViewQuestionnaire(questionnaire)}
                onDelete={() => handleDeleteQuestionnaire(questionnaire)}
              />
            ))}

            {questionnaires.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No questionnaires found
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Pagination */}
      {!isLoading && questionnaires.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* AI Generate Questionnaire Dialog */}
      <Dialog
        open={aiGenerateDialogOpen}
        onClose={() => {
          setAiGenerateDialogOpen(false);
          setSelectedPdfFile(null);
          if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
          }
        }}
        maxWidth="md"
        fullWidth
        // slotProps={{
        //   backdrop: {
        //     sx: {
        //       backgroundColor: 'rgba(0, 0, 0, 0.5)'
        //     },
        //   },
        // }}
        // PaperProps={{
        //   sx: {
        //     '@keyframes borderAnimation': {
        //       '0%': {
        //         backgroundImage: 'linear-gradient(0deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       },
        //       '25%': {
        //         backgroundImage: 'linear-gradient(90deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       },
        //       '50%': {
        //         backgroundImage: 'linear-gradient(180deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       },
        //       '75%': {
        //         backgroundImage: 'linear-gradient(270deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       },
        //       '100%': {
        //         backgroundImage: 'linear-gradient(360deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       },
        //     },
        //     position: 'relative',
        //     border: 'none',
        //     backgroundOrigin: 'border-box',
        //     backgroundClip: 'padding-box, border-box',
        //     '&::before': {
        //       content: '""',
        //       position: 'absolute',
        //       inset: 0,
        //       borderRadius: 'inherit',
        //       padding: '2px',
        //       background: 'linear-gradient(0deg, #ff6b35, #c0c0c0, #ff6b35, #c0c0c0)',
        //       WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        //       WebkitMaskComposite: 'xor',
        //       mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        //       maskComposite: 'exclude',
        //       animation: 'borderAnimation 2s linear 1 forwards',
        //       pointerEvents: 'none',
        //       zIndex: 1,
        //     },
        //     '& > *': {
        //       position: 'relative',
        //       zIndex: 2,
        //     },
        //   },
        // }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={botIcon}
              alt="AI Bot"
              sx={{
                width: 64,
                height: 64,
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1.25rem' }}>
                Generate FHIR Questionnaires from Medical Policies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a medical policy PDF to automatically preprocess policy data, extract key decision scenarios, and generate structured FHIR Questionnaires ready for prior authorization workflows.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 3,
              border: '2px dashed',
              borderColor: selectedPdfFile ? 'primary.main' : 'divider',
              borderRadius: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              bgcolor: selectedPdfFile ? 'action.hover' : 'transparent',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => pdfInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handlePdfFileSelect}
              ref={pdfInputRef}
              style={{ display: 'none' }}
              id="pdf-file-input"
            />
            <UploadIcon size={40} style={{ marginBottom: '16px', opacity: 0.6 }} />
            {selectedPdfFile ? (
              <>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 500 }}>
                  {selectedPdfFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                  Click to change file
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Drop your PDF here or click to browse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported format: PDF • Max file size: 10MB
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setAiGenerateDialogOpen(false);
              setSelectedPdfFile(null);
              if (pdfInputRef.current) {
                pdfInputRef.current.value = '';
              }
            }}
            variant="text"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateWithAI}
            disabled={!selectedPdfFile}
            sx={{
              background: !selectedPdfFile ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: !selectedPdfFile ? undefined : 'linear-gradient(135deg, #5568d3 0%, #63408a 100%)',
              },
            }}
          >
            Generate Questionnaire
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setQuestionnaireToDelete(null);
        }}
        onConfirm={confirmDeleteQuestionnaire}
        itemType="Questionnaire"
        itemName={questionnaireToDelete?.title || ''}
        consequence="all associated data and configurations will be permanently lost"
        isDeleting={isDeleting}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

