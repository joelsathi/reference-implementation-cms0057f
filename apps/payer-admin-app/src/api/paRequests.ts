const API_BASE_URL = window.config?.BFF_URL || 'http://localhost:6091/v1';

import type { PARequestDetail } from '../types/api';

/**
 * PA Request Urgency (from OpenAPI spec)
 */
export type PARequestUrgency = 'Urgent' | 'Standard' | 'Deferred';

/**
 * PA Request Processing Status
 */
export type PARequestProcessingStatus = 'Pending' | 'Completed' | 'Error';

/**
 * PA Request List Item
 */
export interface PARequestListItem {
  requestId: string;
  responseId: string;
  urgency: PARequestUrgency;
  patientId: string;
  practitionerId?: string;
  provider: string;
  dateSubmitted: string;
}

/**
 * PA Request Analytics
 */
export interface PARequestAnalytics {
  urgentCount: number;
  standardCount: number;
  reAuthorizationCount: number;
  appealCount: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

/**
 * PA Request List Response
 */
export interface PARequestListResponse {
  data: PARequestListItem[];
  pagination: PaginationMeta;
  analytics: PARequestAnalytics;
}

/**
 * Item Adjudication Submission
 */
export interface ItemAdjudicationSubmission {
  sequence: number;
  adjudicationCode: string;
  approvedAmount?: number;
  itemNotes?: string;
}

/**
 * Adjudication Submission Request
 */
export interface AdjudicationSubmission {
  decision: string;
  itemAdjudications: ItemAdjudicationSubmission[];
  reviewerNotes?: string;
}

/**
 * Adjudication Response
 */
export interface AdjudicationResponse {
  id: string;
  status: string;
  message: string;
}

/**
 * Error Payload
 */
export interface ErrorPayload {
  timestamp: string;
  status: number;
  reason: string;
  message: string;
  path: string;
  method: string;
}

class PARequestsAPI {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ErrorPayload = await response.json().catch(() => ({
        timestamp: new Date().toISOString(),
        status: response.status,
        reason: response.statusText,
        message: 'An error occurred',
        path: endpoint,
        method: options?.method || 'GET',
      }));
      throw error;
    }

    return response.json();
  }

  /**
   * Get list of PA requests
   * @param search - Search by patient ID or request ID
   * @param urgency - Filter by urgency levels
   * @param status - Filter by processing status (default: Pending only)
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page (max 10, recommended 5)
   */
  async listPARequests(params?: {
    search?: string;
    urgency?: PARequestUrgency[];
    status?: PARequestProcessingStatus[];
    page?: number;
    limit?: number;
  }): Promise<PARequestListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.search) {
      queryParams.append('search', params.search);
    }

    if (params?.urgency && params.urgency.length > 0) {
      params.urgency.forEach((u) => queryParams.append('urgency', u));
    }

    if (params?.status && params.status.length > 0) {
      params.status.forEach((s) => queryParams.append('status', s));
    }

    if (params?.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }

    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/pa-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<PARequestListResponse>(endpoint);
  }

  /**
   * Get PA request details by ID
   * @param requestId - Unique PA request identifier
   */
  async getPARequestDetail(requestId: string): Promise<PARequestDetail> {
    return this.request<PARequestDetail>(`/pa-requests/${requestId}`);
  }

  /**
   * Submit adjudication decision for a PA request
   * @param requestId - Unique PA request identifier
   * @param adjudication - Adjudication submission data
   */
  async submitAdjudication(
    requestId: string,
    adjudication: AdjudicationSubmission
  ): Promise<AdjudicationResponse> {
    return this.request<AdjudicationResponse>(
      `/pa-requests/${requestId}/adjudication`,
      {
        method: 'POST',
        body: JSON.stringify(adjudication),
      }
    );
  }
}

export const paRequestsAPI = new PARequestsAPI();
