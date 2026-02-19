import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/useAuth';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    InputAdornment,
    Menu,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Divider,
    Pagination,
} from '@wso2/oxygen-ui';
import { Search, ListFilter, ArrowLeft } from '@wso2/oxygen-ui-icons-react';

interface ProcessedPARequest {
    requestId: string;
    responseId: string;
    patientId: string;
    practitionerId: string;
    provider: string;
    dateSubmitted: string;
    dateProcessed: string;
    status: 'Complete' | 'Error';
}

// Mock data - Processed requests (Complete/Error)
const mockProcessedRequests: ProcessedPARequest[] = [
    {
        requestId: 'PA-2024-010',
        responseId: 'RESP-2024-010',
        patientId: 'PT-1010',
        practitionerId: 'PR-2010',
        provider: 'City Health Hospital',
        dateSubmitted: '2024-01-20',
        dateProcessed: '2024-01-22',
        status: 'Complete',
    },
    {
        requestId: 'PA-2024-011',
        responseId: 'RESP-2024-011',
        patientId: 'PT-1011',
        practitionerId: 'PR-2011',
        provider: 'General Medical Center',
        dateSubmitted: '2024-01-18',
        dateProcessed: '2024-01-25',
        status: 'Error',
    },
    {
        requestId: 'PA-2024-012',
        responseId: 'RESP-2024-012',
        patientId: 'PT-1012',
        practitionerId: 'PR-2012',
        provider: 'Metro Clinic',
        dateSubmitted: '2024-01-15',
        dateProcessed: '2024-01-28',
        status: 'Complete',
    },
    {
        requestId: 'PA-2024-013',
        responseId: 'RESP-2024-013',
        patientId: 'PT-1013',
        practitionerId: 'PR-2013',
        provider: 'Regional Hospital',
        dateSubmitted: '2024-01-12',
        dateProcessed: '2024-01-20',
        status: 'Complete',
    },
    {
        requestId: 'PA-2024-014',
        responseId: 'RESP-2024-014',
        patientId: 'PT-1014',
        practitionerId: 'PR-2014',
        provider: 'City Health Hospital',
        dateSubmitted: '2024-01-10',
        dateProcessed: '2024-01-12',
        status: 'Error',
    },
];

// Constants
const ITEMS_PER_PAGE = 10;

export default function ProcessedPARequests() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [page, setPage] = useState(1);

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
        navigate('/pa-requests');
    };

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleStatusToggle = (status: string) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };

    const clearFilters = () => {
        setSelectedStatuses([]);
    };

    const handleRowClick = (requestId: string) => {
        navigate(`/pa-requests/processed/${requestId}`);
    };

    const getStatusColor = (status: string): 'success' | 'error' => {
        return status === 'Complete' ? 'success' : 'error';
    };

    const filteredRequests = mockProcessedRequests.filter((request) => {
        const matchesSearch =
            request.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.responseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.provider.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(request.status);

        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalCount = filteredRequests.length;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
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

    return (
        <Box sx={{ p: 4 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowLeft size={20} />}
                onClick={handleBack}
                sx={{ mb: 3 }}
                variant="text"
            >
                Back to Pending Requests
            </Button>

            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        mb: 1
                    }}
                >
                    Processed Prior Authorization Requests
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.tertiary',
                        maxWidth: 600,
                        lineHeight: 1.6
                    }}
                >
                    View all completed and denied prior authorization requests
                </Typography>
            </Box>

            {/* Search and Filter */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Response ID, Request ID, Patient ID, or Provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={15} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Box
                                    onClick={handleFilterClick}
                                    sx={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'text.secondary',
                                        '&:hover': {
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    <ListFilter size={15} />
                                </Box>
                            </InputAdornment>
                        ),
                    }}
                />
                <Menu
                    anchorEl={filterAnchorEl}
                    open={Boolean(filterAnchorEl)}
                    onClose={handleFilterClose}
                >
                    <Box sx={{ px: 3, py: 2, minWidth: 250 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Status
                        </Typography>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedStatuses.includes('Complete')}
                                        onChange={() => handleStatusToggle('Complete')}
                                    />
                                }
                                label="Complete"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedStatuses.includes('Error')}
                                        onChange={() => handleStatusToggle('Error')}
                                    />
                                }
                                label="Error"
                            />
                        </FormGroup>
                    </Box>

                    <Divider />

                    <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={clearFilters}
                        >
                            Clear All
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            onClick={handleFilterClose}
                        >
                            Apply
                        </Button>
                    </Box>
                </Menu>
            </Box>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Response ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Patient ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Provider</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Date Submitted</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Date Processed</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedRequests.map((request) => (
                            <TableRow
                                key={request.requestId}
                                onClick={() => handleRowClick(request.requestId)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                            >
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {request.responseId}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.status}
                                        color={getStatusColor(request.status)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{request.patientId}</TableCell>
                                <TableCell>{request.provider}</TableCell>
                                <TableCell>{request.dateSubmitted}</TableCell>
                                <TableCell>{request.dateProcessed}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {paginatedRequests.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No processed requests found matching your criteria
                    </Typography>
                </Box>
            )}

            {/* Pagination */}
            {paginatedRequests.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
}
