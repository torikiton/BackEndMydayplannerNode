export interface Tasksmodel {
    task_id:     number;
    board_id:    number;
    task_name:   string;
    description: string;
    status:      string;
    priority:    string;
    due_date:    null;
    is_archive:  number;
    create_by:   number;
    assigned_to: null;
    create_at:   Date;
}