// backend/src/models/taskModel.ts
import db from '../config/db';
import { CreateTaskRequest, Task, TaskDB, UpdateTaskRequest, TaskProgressDB, TaskProgress } from '../types';
import { mapTaskDBToTask, mapTaskProgressDBToTaskProgress } from '../utils/mapper';

export const createTask = async (userId: string, taskData: CreateTaskRequest): Promise<Task> => {
    const result = await db.query<TaskDB>(
        `INSERT INTO tasks (user_id, category, task_name, description, expected_start_date, expected_working_hours, hourly_rate_offered, rate_currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, taskData.category, taskData.taskName, taskData.description, taskData.expectedStartDate, taskData.expectedWorkingHours, taskData.hourlyRateOffered, taskData.rateCurrency]
    );
    return mapTaskDBToTask(result.rows[0]);
};

export const findTaskById = async (id: string): Promise<TaskDB | null> => {
    try {
        const result = await db.query<TaskDB>('SELECT * FROM tasks WHERE id = $1', [id]);
        return result.rows[0] || null; // Returns the first row if found, otherwise null
    } catch (error) {
        console.error('Error in findTaskById model:', error);
        throw error; // Re-throw to be caught by the controller
    }
};

export const updateTask = async (id: string, userId: string, taskData: UpdateTaskRequest): Promise<Task | null> => {
    const fields = Object.keys(taskData)
        .filter(key => (taskData as any)[key] !== undefined)
        .map((key, index) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 3}`);
    const values = Object.values(taskData).filter(value => value !== undefined);

    if (fields.length === 0) {
        return null;
    }

    const query = `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`;
    const result = await db.query<TaskDB>(query, [id, userId, ...values]);

    return result.rows[0] ? mapTaskDBToTask(result.rows[0]) : null;
};

export const findTasksByUserId = async (userId: string): Promise<Task[]> => {
    const result = await db.query<TaskDB>('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows.map(mapTaskDBToTask);
};

export const findAllOpenTasks = async (): Promise<Task[]> => {
    const result = await db.query<TaskDB>("SELECT * FROM tasks WHERE status = 'open' ORDER BY created_at DESC");
    return result.rows.map(mapTaskDBToTask);
};
export const findAllTasks = async (status?: string): Promise<Task[]> => {
    let query = 'SELECT * FROM tasks';
    const params: string[] = [];

    if (status) {
        query += ' WHERE status = $1';
        params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const result = await db.query<TaskDB>(query, params);
    return result.rows.map(mapTaskDBToTask);
};
export const updateTaskStatus = async (taskId: string, newStatus: string): Promise<Task | null> => {
    const result = await db.query<TaskDB>(
        `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [newStatus, taskId]
    );
    return result.rows[0] ? mapTaskDBToTask(result.rows[0]) : null;
};

export const addTaskProgress = async (taskId: string, providerId: string, description: string): Promise<TaskProgress> => {
    const result = await db.query<TaskProgressDB>(
        `INSERT INTO task_progress (task_id, provider_id, description)
         VALUES ($1, $2, $3) RETURNING *`,
        [taskId, providerId, description]
    );
    return mapTaskProgressDBToTaskProgress(result.rows[0]);
};

export const findTaskProgressByTaskId = async (taskId: string): Promise<TaskProgress[]> => {
    const result = await db.query<TaskProgressDB>(
        'SELECT * FROM task_progress WHERE task_id = $1 ORDER BY progress_timestamp ASC',
        [taskId]
    );
    return result.rows.map(mapTaskProgressDBToTaskProgress);
};

export const findAcceptedTasksForProvider = async (providerId: string): Promise<Task[]> => {
    const result = await db.query<TaskDB>(
        `SELECT t.* FROM tasks t
         JOIN offers o ON t.id = o.task_id
         WHERE o.provider_id = $1 AND o.offer_status = 'accepted'
         ORDER BY t.created_at DESC`,
        [providerId]
    );
    return result.rows.map(mapTaskDBToTask);
};