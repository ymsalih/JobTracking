export type UserRole = 'admin' | 'worker';
export type TaskStatus = 'beklemede' | 'tamamlandý';

export interface Company {
    id: string;
    name: string;
    details?: string;
    created_at: string;
}

export interface Task {
    id: string;
    company_id: string;
    assigned_worker_id: string;
    client_name: string;
    client_address: string;
    client_phone: string;
    description: string;
    status: TaskStatus;
    created_at: string;
}