import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Alert,
} from '@wso2/oxygen-ui';
import { Search, ListFilter } from '@wso2/oxygen-ui-icons-react';
import { paRequestsAPI, type PARequestUrgency, type PARequestListItem } from '../api/paRequests';
import LoadingTableSkeleton from '../components/LoadingTableSkeleton';

// Constants
const ITEMS_PER_PAGE = 8;

export default function PARequests() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUrgencies, setSelectedUrgencies] = useState<PARequestUrgency[]>([]);
    const [page, setPage] = useState(1);
    const [requests, setRequests] = useState<PARequestListItem[]>([]);
    // const [analytics, setAnalytics] = useState<PARequestAnalytics | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch PA requests from API
    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await paRequestsAPI.listPARequests({
                    search: searchQuery || undefined,
                    urgency: selectedUrgencies.length > 0 ? selectedUrgencies : undefined,
                    status: ['Pending'],
                    page,
                    limit: ITEMS_PER_PAGE,
                });
                setRequests(response.data);
                // setAnalytics(response.analytics);
                setTotalPages(response.pagination.totalPages);
            } catch (err) {
                console.error('Error fetching PA requests:', err);
                setError('Failed to load PA requests. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [searchQuery, selectedUrgencies, page]);

    const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setFilterAnchorEl(event.currentTarget);
    };

    // Helper to format date strings by removing time component
    const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    // If date contains 'T', split and return only the date part (YYYY-MM-DD)
    return dateString.split('T')[0];
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleUrgencyToggle = (urgency: PARequestUrgency) => {
        setSelectedUrgencies((prev) =>
            prev.includes(urgency)
                ? prev.filter((u) => u !== urgency)
                : [...prev, urgency]
        );
    };

    const clearFilters = () => {
        setSelectedUrgencies([]);
    };

    const handleRowClick = (responseId: string) => {
        navigate(`/pa-requests/${responseId}`);
    };

    const handleViewProcessed = () => {
        navigate('/pa-requests/processed');
    };

    const getTypeColor = (
        type: string
    ): 'error' | 'default' => {
        return type === 'Urgent' ? 'error' : 'default';
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    return (
        <Box sx={{ p: 4}}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            mb: 1
                        }}
                    >
                        Prior Authorization Requests
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'text.tertiary',
                            maxWidth: 600,
                            lineHeight: 1.6
                        }}
                    >
                        Review and manage pending prior authorization requests
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    onClick={handleViewProcessed}
                    sx={{ mt: 0.5 }}
                >
                    View Processed Requests
                </Button>
            </Box>

            {/* Analytics Cards */}
            {/* <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(4, 1fr)',
                    },
                    gap: 2.5,
                    mb: 2,
                }}
            >
                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    paddingBottom: 0.5,
                                    color: 'error.main',
                                    fontSize: { xs: '2rem', md: '2.5rem' }
                                }}
                            >
                                {analytics?.urgentCount ?? 0}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.tertiary',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em'
                                }}
                            >
                                Urgent Requests
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    paddingBottom: 0.5,
                                    fontSize: { xs: '2rem', md: '2.5rem' }
                                }}
                            >
                                {analytics?.standardCount ?? 0}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.tertiary',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em'
                                }}
                            >
                                Standard Requests
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    paddingBottom: 0.5,
                                    fontSize: { xs: '2rem', md: '2.5rem' }
                                }}
                            >
                                {analytics?.reAuthorizationCount ?? 0}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.tertiary',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em'
                                }}
                            >
                                Re-authorization
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    paddingBottom: 0.5,
                                    fontSize: { xs: '2rem', md: '2.5rem' }
                                }}
                            >
                                {analytics?.appealCount ?? 0}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.tertiary',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em'
                                }}
                            >
                                Appeals
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box> */}

            {/* Search and Filter */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Request ID, Patient ID, or Provider..."
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
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedUrgencies.includes('Urgent')}
                                        onChange={() => handleUrgencyToggle('Urgent')}
                                    />
                                }
                                label="Urgent"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedUrgencies.includes('Standard')}
                                        onChange={() => handleUrgencyToggle('Standard')}
                                    />
                                }
                                label="Standard"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedUrgencies.includes('Deferred')}
                                        onChange={() => handleUrgencyToggle('Deferred')}
                                    />
                                }
                                label="Deferred"
                            />
                            {/* <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedUrgencies.includes('Appeal')}
                                        onChange={() => handleUrgencyToggle('Appeal')}
                                    />
                                }
                                label="Appeal"
                            /> */}
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
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Request ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Urgency</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Patient ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Practitioner ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Provider</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>Date Submitted</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <LoadingTableSkeleton rows={4} columns={6} />
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No requests found matching your criteria
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request) => (
                            <TableRow
                                key={request.requestId}
                                onClick={() => handleRowClick(request.responseId)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                            >
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {request.requestId}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.urgency}
                                        color={getTypeColor(request.urgency)}
                                        size="small"
                                        variant={request.urgency === 'Urgent' ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell>{request.patientId}</TableCell>
                                <TableCell>{request.practitionerId || '-'}</TableCell>
                                <TableCell>{request.provider}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ paddingLeft: "1vw" }}>
                                        {formatDate(request.dateSubmitted)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {!loading && requests.length > 0 && (
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
