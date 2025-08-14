export type RequestListItem = {
  id: string;
  status: string;
  createdAt: string;
};

export type ExchangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export type ExchangeRequest = {
  id: string;
  store_id: string;
  requester_id: string;
  shift_id: string;
  target_user_id: string | null;
  reason: string | null;
  status: ExchangeRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  shift?: {
    id: string;
    start_time: string;
    end_time: string;
    position: string | null;
  };
  requester?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  target_user?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
  approved_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
};

export type CreateExchangeRequestInput = {
  store_id: string;
  shift_id: string;
  target_user_id: string | null;
  reason?: string;
};

export type UpdateExchangeRequestInput = {
  id: string;
  status: ExchangeRequestStatus;
  approved_by?: string;
  approved_at?: string;
};
