import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@wso2/oxygen-ui';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  User,
  AlertCircle,
  Activity,
  FileCheck,
  Sparkles,
  Calendar,
  ClipboardList,
  Package,
  Scale,
  FileQuestion,
  Paperclip,
  Eye,
} from '@wso2/oxygen-ui-icons-react';
import type {
  AdjudicationCode,
  DocumentReference,
  AIAnalysis,
} from '../types/claimItem';
import {
  AdjudicationCodeDisplay,
  AdjudicationCodeDescription,
} from '../types/claimItem';
import type {
  ClaimItem,
  ClaimItemWithAdjudication,
  PARequestDetail as PARequestDetailType,
  CodeableConcept
} from '../types/api';
import { paRequestsAPI } from '../api/paRequests';
import { PARequestDetailSkeleton } from '../components/LoadingSkeletons';
import { useAuth } from '../components/useAuth';

// Adjudication codes available for selection
const ADJUDICATION_CODES: AdjudicationCode[] = [
  'submitted',
  'copay',
  'eligible',
  'deductible',
  'unallocdeduct',
  'eligpercent',
  'tax',
  'benefit',
];

// Helper functions to extract FHIR data
const getProductOrServiceCode = (productOrService: CodeableConcept): string | undefined => {
  return productOrService.coding?.[0]?.code;
};

const getProductOrServiceSystem = (productOrService: CodeableConcept): string | undefined => {
  return productOrService.coding?.[0]?.system;
};

const getProductOrServiceDisplay = (productOrService: CodeableConcept): string | undefined => {
  return productOrService.coding?.[0]?.display || productOrService.text;
};

const getProductOrServiceName = (productOrService: CodeableConcept): string => {
  return getProductOrServiceDisplay(productOrService) || getProductOrServiceCode(productOrService) || 'N/A';
};

const getServiceDate = (item: ClaimItem): string => {
  if (item.servicedDate) {
    return formatDate(item.servicedDate);
  }
  if (item.servicedPeriod) {
    const start = item.servicedPeriod.start ? formatDate(item.servicedPeriod.start) : undefined;
    const end = item.servicedPeriod.end ? formatDate(item.servicedPeriod.end) : undefined;
    if (start && end) {
      return start === end ? start : `${start} to ${end}`;
    }
    return start || end || 'N/A';
  }
  return 'N/A';
};

// Helper to format date strings by removing time component
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  // If date contains 'T', split and return only the date part (YYYY-MM-DD)
  return dateString.split('T')[0];
};

// Initialize claim items with adjudication state
const initializeItemsWithState = (items: ClaimItem[]): ClaimItemWithAdjudication[] => {
  return items.map((item) => ({
    ...item,
    selectedAdjudicationCode: undefined,
    adjudicationAmount: (item.net as { value: number })?.value,
    adjudicationPercent: undefined,
    itemReviewNote: '',
    isReviewed: false,
  }));
};

export default function PARequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams<{ requestId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [paRequest, setPaRequest] = useState<PARequestDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallNotes, setOverallNotes] = useState('');
  const [claimItems, setClaimItems] = useState<ClaimItemWithAdjudication[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | false>(1);
  const [expandedQuestionnaire, setExpandedQuestionnaire] = useState<number | false>(0);
  const [expandedAttachment, setExpandedAttachment] = useState<number | false>(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch PA request details
  useEffect(() => {
    const fetchPARequestDetail = async () => {
      if (!requestId) {
        setError('Request ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await paRequestsAPI.getPARequestDetail(requestId);
        setPaRequest(response);
        setClaimItems(initializeItemsWithState(response.items));
      } catch (err) {
        console.error('Error fetching PA request detail:', err);
        setError('Failed to load PA request details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPARequestDetail();
  }, [requestId]);

  // Check if we're coming from the processed page
  const isProcessedView = location.pathname.includes('/processed/');

  const updateItemAdjudication = useCallback((
    sequence: number,
    field: keyof ClaimItemWithAdjudication,
    value: unknown
  ) => {
    setClaimItems((prev) =>
      prev.map((item) =>
        item.sequence === sequence ? { ...item, [field]: value } : item
      )
    );
  }, []);

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

  const handleBack = () => {
    if (isProcessedView) {
      navigate('/pa-requests/processed');
    } else {
      navigate('/pa-requests');
    }
  };

  const handleItemAccordionChange = (sequence: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedItem(isExpanded ? sequence : false);
  };

  const handleQuestionnaireAccordionChange = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedQuestionnaire(isExpanded ? index : false);
  };

  const handleAttachmentAccordionChange = (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAttachment(isExpanded ? index : false);
  };

  // Helper to extract questionnaire response items from the JSON questionnaire field
  const getQuestionnaireItems = (questionnaire: unknown): Array<{ 
    linkId: string; 
    text?: string; 
    answer?: Array<{ 
      valueString?: string; 
      valueBoolean?: boolean; 
      valueInteger?: number;
      valueCoding?: { system?: string; code?: string; display?: string };
    }>;
    item?: Array<{ 
      linkId: string; 
      text?: string; 
      answer?: Array<{ 
        valueString?: string; 
        valueBoolean?: boolean; 
        valueInteger?: number;
        valueCoding?: { system?: string; code?: string; display?: string };
      }>;
    }>;
  }> => {
    const q = questionnaire as { item?: Array<{ 
      linkId: string; 
      text?: string; 
      answer?: Array<{ 
        valueString?: string; 
        valueBoolean?: boolean; 
        valueInteger?: number;
        valueCoding?: { system?: string; code?: string; display?: string };
      }>;
      item?: Array<{ 
        linkId: string; 
        text?: string; 
        answer?: Array<{ 
          valueString?: string; 
          valueBoolean?: boolean; 
          valueInteger?: number;
          valueCoding?: { system?: string; code?: string; display?: string };
        }>;
      }>;
    }> };
    
    // Flatten nested items (handle group items)
    const items = q.item || [];
    const flattenedItems: typeof items = [];
    
    items.forEach(item => {
      if (item.item && item.item.length > 0) {
        // If item has nested items, add them
        flattenedItems.push(...item.item);
      } else if (item.answer && item.answer.length > 0) {
        // If item has answers, add it
        flattenedItems.push(item);
      }
    });
    
    return flattenedItems;
  };

  const getQuestionnaireName = (questionnaire: unknown): string => {
    const q = questionnaire as { 
      questionnaireName?: string; 
      questionnaireId?: string;
      questionnaire?: string;
      id?: string;
    };
    return q.questionnaireName || q.questionnaire || q.id || 'Questionnaire';
  };

  const getQuestionnaireId = (questionnaire: unknown): string => {
    const q = questionnaire as { id?: string; questionnaireId?: string; questionnaire?: string };
    return q.id || q.questionnaireId || q.questionnaire || 'unknown';
  };

  // Helper to format answer values
  const formatAnswerValue = (answer?: Array<{ 
    valueString?: string; 
    valueBoolean?: boolean; 
    valueInteger?: number;
    valueCoding?: { system?: string; code?: string; display?: string };
  }>): string => {
    if (!answer || answer.length === 0) return 'No answer provided';
    
    const firstAnswer = answer[0];
    
    if (firstAnswer.valueCoding) {
      return firstAnswer.valueCoding.display || firstAnswer.valueCoding.code || 'N/A';
    }
    if (firstAnswer.valueString) {
      return firstAnswer.valueString;
    }
    if (firstAnswer.valueBoolean !== undefined) {
      return firstAnswer.valueBoolean ? 'Yes' : 'No';
    }
    if (firstAnswer.valueInteger !== undefined) {
      return firstAnswer.valueInteger.toString();
    }
    
    return 'No answer provided';
  };

  // Helper to extract attachment details
  const getAttachmentDetails = (attachment: unknown) => {
    const att = attachment as DocumentReference;
    return {
      id: att.id || 'unknown',
      type: att.type,
      description: att.description,
      date: att.date,
      content: att.content,
    };
  };

  const handleSaveDraft = async () => {
    if (!requestId) return;
    
    setSubmitting(true);
    try {
      const adjudication = {
        decision: 'partial',
        itemAdjudications: claimItems.map((item) => ({
          sequence: item.sequence,
          adjudicationCode: item.selectedAdjudicationCode || 'submitted',
          approvedAmount: item.adjudicationAmount,
          itemNotes: item.itemReviewNote,
        })),
        reviewerNotes: overallNotes,
      };
      
      const response = await paRequestsAPI.submitAdjudication(requestId, adjudication);
      console.log('Draft saved:', response);
      
      // Navigate back to requests page after successful save
      navigate('/pa-requests');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReview = async () => {
    if (!requestId) return;
    
    setSubmitting(true);
    try {
      const adjudication = {
        decision: 'complete',
        itemAdjudications: claimItems.map((item) => ({
          sequence: item.sequence,
          adjudicationCode: item.selectedAdjudicationCode || 'submitted',
          approvedAmount: item.adjudicationAmount,
          itemNotes: item.itemReviewNote,
        })),
        reviewerNotes: overallNotes,
      };
      
      const response = await paRequestsAPI.submitAdjudication(requestId, adjudication);
      console.log('Review completed:', response);
      
      // Navigate back to requests page after successful completion
      navigate('/pa-requests');
    } catch (err) {
      console.error('Error completing review:', err);
      setError('Failed to complete review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Map raw status to display label
  const getStatusLabel = (status: string): string => {
    if (status === 'queued' || status === 'partial') return 'Pending';
    if (status === 'complete') return 'Complete';
    if (status === 'error') return 'Error';
    return status; // fallback to original status
  };

  // Determine chip color based on status
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    if (status === 'complete') return 'success';
    if (status === 'error') return 'error';
    return 'warning'; // queued, partial, or other statuses
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get icon for document type
  const getDocumentIcon = (contentType?: string) => {
    if (contentType?.includes('image') || contentType?.includes('dicom')) {
      return <ImageIcon size={24} />;
    }
    return <FileText size={24} />;
  };

  // Render AI Analysis for items with questionnaire responses
  const renderAIAnalysis = (aiAnalysis?: AIAnalysis) => {
    if (!aiAnalysis) return null;

    const getRecommendationColor = (rec: 'approve' | 'deny' | 'review') => {
      if (rec === 'approve') return 'success';
      if (rec === 'deny') return 'error';
      return 'warning';
    };

    const getRecommendationIcon = (rec: 'approve' | 'deny' | 'review') => {
      if (rec === 'approve') return <CheckCircle size={18} />;
      if (rec === 'deny') return <XCircle size={18} />;
      return <AlertCircle size={18} />;
    };

    const getRiskColor = (risk?: 'low' | 'medium' | 'high') => {
      if (risk === 'low') return 'success';
      if (risk === 'high') return 'error';
      return 'warning';
    };

    return (
      <Box sx={{ mt: 2 }}>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            borderColor: `${getRecommendationColor(aiAnalysis.recommendation)}.main`,
            borderWidth: 2,
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Sparkles size={20} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              AI Analysis & Recommendation
            </Typography>
          </Box>

          {/* Recommendation Alert */}
          <Alert
            severity={getRecommendationColor(aiAnalysis.recommendation)}
            icon={getRecommendationIcon(aiAnalysis.recommendation)}
            sx={{ mb: 2 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Recommended: {aiAnalysis.recommendation.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Confidence: {aiAnalysis.confidenceScore}%
              </Typography>
            </Box>
          </Alert>

          {/* Summary */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {aiAnalysis.summary}
          </Typography>

          {/* Criteria Matches */}
          {aiAnalysis.criteriaMatches && aiAnalysis.criteriaMatches.length > 0 && (
            <Accordion sx={{ mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ChevronDown size={18} />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 1 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Criteria Analysis ({aiAnalysis.criteriaMatches.filter(c => c.met).length}/{aiAnalysis.criteriaMatches.length} met)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Stack spacing={1}>
                  {aiAnalysis.criteriaMatches.map((criteria, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {criteria.met ? (
                        <CheckCircle size={16} color="green" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <XCircle size={16} color="red" style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {criteria.criteria}
                        </Typography>
                        {criteria.details && (
                          <Typography variant="caption" color="text.secondary">
                            {criteria.details}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Risk Level & Policy Reference */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            {aiAnalysis.riskLevel && (
              <Chip
                label={`Risk: ${aiAnalysis.riskLevel.charAt(0).toUpperCase() + aiAnalysis.riskLevel.slice(1)}`}
                size="small"
                color={getRiskColor(aiAnalysis.riskLevel)}
                variant="outlined"
              />
            )}
            {aiAnalysis.policyReference && (
              <Chip
                label={`Policy: ${aiAnalysis.policyReference}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowLeft size={20} />}
        onClick={handleBack}
        sx={{ mb: 3 }}
        variant="text"
      >
        {isProcessedView ? 'Back to Processed Requests' : 'Back to Pending Requests'}
      </Button>

      {/* Loading State */}
      {loading && <PARequestDetailSkeleton />}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content - only show if loaded and no error */}
      {!loading && !error && paRequest && (
        <>
      {/* Header with Status */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Prior Authorization Request
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Request ID: {paRequest.id}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(paRequest.status)}
          color={getStatusColor(paRequest.status)}
          sx={{ fontWeight: 600, px: 1 }}
        />
      </Box>

      {/* Top Section: Summary Cards */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        {/* PA Request Summary */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FileCheck size={24} style={{ marginRight: 8 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Request Summary
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
              <Box sx={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column'}}>
                <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5, fontWeight: 700 }}>
                  Service Type
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {paRequest.summary.serviceType}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column'}}>
                <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5, paddingLeft: "0.5vw", fontWeight: 700 }}>
                  Priority
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '28px', paddingLeft: "0.2vw" }}>
                  <Chip 
                    label={paRequest.priority} 
                    color={paRequest.priority === 'urgent' ? 'error' : 'default'} 
                    size="small" 
                  />
                </Box>
              </Box>
              <Box sx={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5, fontWeight: 700 }}>
                  Submitted Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '28px', paddingLeft: "0.5vw" }}>
                  <Typography variant="body2">{formatDate(paRequest.summary.submittedDate)}</Typography>
                </Box>
              </Box>
              <Box sx={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 0.5, paddingLeft: "0.9vw", fontWeight: 700 }}>
                  Target Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '28px', paddingLeft: "1vw" }}>
                  <Typography variant="body2">{formatDate(paRequest.summary.targetDate)}</Typography>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 700 }}>
                Clinical Justification
              </Typography>
              <Typography variant="body2">
                {paRequest.summary.clinicalJustification || 'Not provided'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Patient IPS and Provider Information */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3}}>
          {/* Patient IPS */}
          <Card sx={{ flex: 1}}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <User size={24} style={{ marginRight: 8 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Patient Information
                </Typography>
              </Box>

              {/* Demographics, Allergies, and Medications layout */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 2, paddingLeft: "0.3vw", paddingRight: 1.5 }}>
                {/* Left Column: Demographics and Allergies */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Demographics */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      Demographics
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
                          Name
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{paRequest.patient.demographics.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
                          DOB
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(paRequest.patient.demographics.dateOfBirth)}
                          {paRequest.patient.demographics.age && ` (${paRequest.patient.demographics.age}y)`}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
                          MRN
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{paRequest.patient.demographics.mrn || 'N/A'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" display="block" sx={{ fontWeight: 700 }}>
                          Gender
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{paRequest.patient.demographics.gender}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ maxWidth: '85%' }} />

                  {/* Allergies */}
                  <Box>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      Allergies & Intolerances
                    </Typography>
                    {paRequest.patient.allergies && paRequest.patient.allergies.length > 0 ? (
                    <Box>
                      <Stack spacing={0.5} divider={<Divider sx={{ maxWidth: '85%' }} />}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, py: 0.75 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Allergy</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Severity</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ maxHeight: '120px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '3px' } }}>
                        <Stack spacing={0.5} divider={<Divider sx={{ maxWidth: '85%' }} />}>
                          {paRequest.patient.allergies.map((allergy, idx) => (
                          <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, py: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{allergy.substance}</Typography>
                            <Typography variant="caption" color="text.secondary">{allergy.severity || 'Unknown'}</Typography>
                          </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No known allergies</Typography>
                    )}
                  </Box>
                </Box>

                {/* Right Column: Medications */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                    Medications
                  </Typography>
                  {paRequest.patient.medications && paRequest.patient.medications.length > 0 ? (
                  <Box sx={{ maxHeight: '280px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '3px' } }}>
                    <Stack spacing={0.5} divider={<Divider />}>
                      {paRequest.patient.medications.map((med, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{med.medication}</Typography>
                        <Typography variant="caption" color="text.secondary">{med.status || 'unknown'}</Typography>
                      </Box>
                      ))}
                    </Stack>
                  </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No medications recorded</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card sx={{ flex: { xs: 1, md: '0 0 18vw' } }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Activity size={24} style={{ marginRight: 8 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Provider Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main', fontSize: '1rem' }}>
                  {paRequest.provider.initials || paRequest.provider.name.substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {paRequest.provider.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paRequest.provider.specialty || 'Provider'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Practitioner ID: {paRequest.provider.id}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                {paRequest.provider.facility && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 800 }}>
                    Facility
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {paRequest.provider.facility.name}
                  </Typography>
                </Box>
                )}
                {paRequest.provider.contact && (paRequest.provider.contact.phone || paRequest.provider.contact.email) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 800 }}>
                    Contact
                  </Typography>
                  {paRequest.provider.contact.phone && (
                    <Typography variant="body2">{paRequest.provider.contact.phone}</Typography>
                  )}
                  {paRequest.provider.contact.email && (
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{paRequest.provider.contact.email}</Typography>
                  )}
                </Box>
                )}
                {paRequest.provider.facility?.address && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 800 }}>
                    Address
                  </Typography>
                  <Typography variant="body2">
                    {paRequest.provider.facility.address.line.join(', ')}
                    {paRequest.provider.facility.address.city && (
                      <>
                        <br />
                        {paRequest.provider.facility.address.city}
                        {paRequest.provider.facility.address.state && `, ${paRequest.provider.facility.address.state}`}
                        {paRequest.provider.facility.address.postalCode && ` ${paRequest.provider.facility.address.postalCode}`}
                      </>
                    )}
                  </Typography>
                </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Requested Items with Per-Item Adjudication */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Package size={24} style={{ marginRight: 8 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Requested Items ({claimItems.length})
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Submitted: ${claimItems.reduce((sum, item) => sum + ((item.net as { value?: number })?.value || 0), 0).toLocaleString()}
            </Typography>
          </Box>

          {/* Items Summary Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service/Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Service Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Adjudication</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claimItems.map((item) => (
                  <TableRow key={item.sequence} hover>
                    <TableCell>{item.sequence}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getProductOrServiceName(item.productOrService)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getProductOrServiceSystem(item.productOrService)}: {getProductOrServiceCode(item.productOrService)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getServiceDate(item)}
                    </TableCell>
                    <TableCell>
                      {item.quantity?.value} {item.quantity?.unit}
                    </TableCell>
                    <TableCell align="right">
                      ${(item.net?.value || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {item.selectedAdjudicationCode ? (
                        <Chip
                          label={AdjudicationCodeDisplay[item.selectedAdjudicationCode as AdjudicationCode]}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isReviewed ? (
                        <Chip label="Reviewed" size="small" color="success" />
                      ) : (
                        <Chip label="Pending" size="small" color="warning" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Questionnaires Section */}
      {paRequest.questionnaires && paRequest.questionnaires.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FileQuestion size={24} style={{ marginRight: 8 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Questionnaires ({paRequest.questionnaires.length})
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              {paRequest.questionnaires.map((qr, index) => (
                <Accordion
                  key={getQuestionnaireId(qr.questionnaire)}
                  expanded={expandedQuestionnaire === index}
                  onChange={handleQuestionnaireAccordionChange(index)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown />}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ClipboardList size={20} />
                        <Typography sx={{ fontWeight: 600 }}>
                          {getQuestionnaireName(qr.questionnaire)}
                        </Typography>
                        <Chip
                          label={`${qr.analysis.recommendation.toUpperCase()}`}
                          size="small"
                          color={
                            qr.analysis.recommendation === 'approve'
                              ? 'success'
                              : qr.analysis.recommendation === 'deny'
                              ? 'error'
                              : 'warning'
                          }
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {qr.analysis.confidenceScore}%
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Questionnaire Responses */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                          Responses
                        </Typography>
                        <Stack spacing={1}>
                          {getQuestionnaireItems(qr.questionnaire).map((qItem, idx) => (
                            <Paper key={qItem.linkId} variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {idx + 1}. {qItem.text}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatAnswerValue(qItem.answer)}
                              </Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>

                      {/* AI Analysis */}
                      {renderAIAnalysis(qr.analysis)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Attachments Section */}
      {paRequest.attachments && paRequest.attachments.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Paperclip size={24} style={{ marginRight: 8 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Attachments ({paRequest.attachments.length})
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              {paRequest.attachments.map((attachment, index) => {
                const details = getAttachmentDetails(attachment);
                return (
                  <Accordion
                    key={details.id}
                    expanded={expandedAttachment === index}
                    onChange={handleAttachmentAccordionChange(index)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ChevronDown />}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        {getDocumentIcon(details.content[0]?.attachment.contentType)}
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {details.description || details.content[0]?.attachment.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {details.content[0]?.attachment.contentType?.split('/')[1]?.toUpperCase()} •{' '}
                            {formatFileSize(details.content[0]?.attachment.size)} • {formatDate(details.date)}
                          </Typography>
                        </Box>
                        <Box>
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                              <Download size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Document Details
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                            {details.type && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Type</Typography>
                                <Typography variant="body2">
                                  {(details.type as { display?: string }).display || (details.type as { code?: string }).code}
                                </Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="caption" color="text.secondary">Date</Typography>
                              <Typography variant="body2">{details.date}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Size</Typography>
                              <Typography variant="body2">
                                {formatFileSize(details.content[0]?.attachment.size)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">Format</Typography>
                              <Typography variant="body2">
                                {details.content[0]?.attachment.contentType}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Item Adjudication Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Scale size={24} style={{ marginRight: 8 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Item Adjudication Details
            </Typography>
          </Box>

          {/* Expandable Item Details with Adjudication */}
          <Stack spacing={2}>
            {claimItems.map((item) => (
              <Accordion
                key={item.sequence}
                expanded={expandedItem === item.sequence}
                onChange={handleItemAccordionChange(item.sequence)}
                sx={{ 
                  border: 1, 
                  borderColor: item.isReviewed ? 'success.main' : 'divider',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown />}
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip label={`Item ${item.sequence}`} size="small" />
                      <Typography sx={{ fontWeight: 600 }}>
                        {getProductOrServiceName(item.productOrService)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ${(item.net?.value || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Item Details */}
                    <Box>
                      {/* Service Details */}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Service Details
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Code</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {getProductOrServiceCode(item.productOrService)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">System</Typography>
                            <Typography variant="body2">{getProductOrServiceSystem(item.productOrService)}</Typography>
                          </Box>
                          {item.productOrService.text && (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Text</Typography>
                              <Typography variant="body2">{item.productOrService.text}</Typography>
                            </Box>
                          )}
                          {item.quantity ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Quantity</Typography>
                              <Typography variant="body2">
                                {item.quantity.value} {item.quantity.unit}
                              </Typography>
                            </Box>
                          ) : null}
                          {item.unitPrice && item.unitPrice.value ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary">Unit Price</Typography>
                              <Typography variant="body2">
                                ${item.unitPrice.value.toLocaleString()} {item.unitPrice.currency}
                              </Typography>
                            </Box>
                          ) : null}
                        </Box>
                        {item.description && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">Description</Typography>
                            <Typography variant="body2">{item.description}</Typography>
                          </Box>
                        )}
                      </Paper>

                      {/* Service Date/Period */}
                      {(item.servicedDate || item.servicedPeriod) && (
                        <>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 1 }}>
                            <Calendar size={18} /> Service Date
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography variant="body2">{getServiceDate(item)}</Typography>
                            {item.servicedPeriod && item.servicedPeriod.start !== item.servicedPeriod.end && (
                              <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                {item.servicedPeriod.start && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">Start</Typography>
                                    <Typography variant="body2">{formatDate(item.servicedPeriod.start)}</Typography>
                                  </Box>
                                )}
                                {item.servicedPeriod.end && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">End</Typography>
                                    <Typography variant="body2">{formatDate(item.servicedPeriod.end)}</Typography>
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Paper>
                        </>
                      )}
                    </Box>

                    {/* Item Adjudication Controls - Below content */}
                    <Divider />
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 2 }}>
                        Item Adjudication
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 2fr auto' }, gap: 2, alignItems: 'start' }}>
                        {/* Adjudication Code Select */}
                        <FormControl fullWidth size="small">
                          <InputLabel>Adjudication Category</InputLabel>
                          <Select
                            value={item.selectedAdjudicationCode || ''}
                            label="Adjudication Category"
                            onChange={(e) => updateItemAdjudication(item.sequence, 'selectedAdjudicationCode', e.target.value as AdjudicationCode)}
                          >
                            {ADJUDICATION_CODES.map((code) => (
                              <MenuItem key={code} value={code}>
                                <Tooltip title={AdjudicationCodeDescription[code]} placement="right">
                                  <Box sx={{ width: '100%' }}>
                                    {AdjudicationCodeDisplay[code]}
                                  </Box>
                                </Tooltip>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Amount/Percentage Input */}
                        {item.selectedAdjudicationCode === 'eligpercent' ? (
                          <TextField
                            fullWidth
                            size="small"
                            label="Eligible Percentage"
                            type="number"
                            value={item.adjudicationPercent || ''}
                            onChange={(e) => updateItemAdjudication(item.sequence, 'adjudicationPercent', parseFloat(e.target.value) || 0)}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            }}
                            inputProps={{ min: 0, max: 100 }}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label="Amount"
                            type="number"
                            value={item.adjudicationAmount || ''}
                            onChange={(e) => updateItemAdjudication(item.sequence, 'adjudicationAmount', parseFloat(e.target.value) || 0)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                          />
                        )}

                        {/* Item Review Note */}
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Item Review Note"
                          placeholder="Enter note for this specific item..."
                          value={item.itemReviewNote}
                          onChange={(e) => updateItemAdjudication(item.sequence, 'itemReviewNote', e.target.value)}
                        />

                        {/* Mark as Reviewed Toggle */}
                        <Button
                          variant={item.isReviewed ? 'contained' : 'outlined'}
                          color={item.isReviewed ? 'success' : 'primary'}
                          startIcon={item.isReviewed ? <CheckCircle size={18} /> : undefined}
                          onClick={() => updateItemAdjudication(item.sequence, 'isReviewed', !item.isReviewed)}
                          sx={{ minWidth: 160, height: 40 }}
                        >
                          {item.isReviewed ? 'Reviewed' : 'Mark as Reviewed'}
                        </Button>
                      </Box>
                    </Paper>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Review Decision Section */}
      {(paRequest.status === 'queued' || paRequest.status === 'partial') && (
        <Card sx={{ mb: 4, bgcolor: 'background.default' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Review Progress
            </Typography>

            {/* Review Summary */}
            <Alert 
              severity={claimItems.every((item) => item.isReviewed) ? 'success' : 'warning'}
              sx={{ mb: 3 }}
            >
              <Typography variant="body2">
                {claimItems.filter((item) => item.isReviewed).length} of {claimItems.length} items reviewed
              </Typography>
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Overall Review Notes"
              placeholder="Enter overall review notes, justification, or additional comments for the entire claim..."
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<FileText size={20} />}
                onClick={handleSaveDraft}
                disabled={submitting}
                sx={{ minWidth: 140 }}
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle size={20} />}
                onClick={handleCompleteReview}
                disabled={!claimItems.every((item) => item.isReviewed) || submitting}
                sx={{ minWidth: 160 }}
              >
                {submitting ? 'Submitting...' : 'Complete Review'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      </>
      )}
    </Box>
  );
}
