// frontend/src/components/TaskCard.tsx
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Task } from '../types'; // Ensure correct path

interface TaskCardProps {
    task: Task;
    showActions?: boolean; // Whether to show action buttons like Edit, Make Offer, etc.
    // Callback for actions
    onMakeOffer?: (taskId: string) => void;
    onViewOffers?: (taskId: string) => void; // For task owner to view offers
    onEdit?: (taskId: string) => void; // For task owner to edit
    onViewProgress?: (taskId: string) => void; // For task owner/provider to view progress
    children?: ReactNode;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    showActions = true,
    onMakeOffer,
    onViewOffers,
    onEdit,
    onViewProgress
}) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-xl font-bold mb-2 text-gray-800">{task.taskName}</h3>
            <p className="text-sm text-gray-600 mb-2">Category: <span className="font-medium">{task.category}</span></p>
            <p className="text-gray-700 mb-4 text-sm">{task.description.length > 150 ? task.description.substring(0, 150) + '...' : task.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span>Starts: <span className="font-semibold">{new Date(task.expectedStartDate).toLocaleDateString()}</span></span>
                <span>Hours: <span className="font-semibold">{task.expectedWorkingHours}</span></span>
                <span>Rate: <span className="font-semibold">{task.hourlyRateOffered} {task.rateCurrency}/hr</span></span>
            </div>
            <div className={`text-sm font-semibold py-1 px-3 rounded-full inline-block ${
                task.status === 'open' ? 'bg-green-100 text-green-800' :
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                task.status === 'completed_pending_review' ? 'bg-yellow-100 text-yellow-800' :
                task.status === 'closed' ? 'bg-gray-200 text-gray-700' :
                'bg-red-100 text-red-800'
            }`}>
                Status: {task.status.replace(/_/g, ' ')}
            </div>

            {showActions && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {onMakeOffer && (
                        <button
                            onClick={() => onMakeOffer(task.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Make Offer
                        </button>
                    )}
                    {onViewOffers && (
                        <button
                            onClick={() => onViewOffers(task.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            View Offers
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={() => onEdit(task.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Edit Task
                        </button>
                    )}
                    {onViewProgress && (
                        <button
                            onClick={() => onViewProgress(task.id)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            View Progress
                        </button>
                    )}
                    {/* Add other actions like complete task, cancel task etc. here */}
                </div>
            )}
        </div>
    );
};

export default TaskCard;