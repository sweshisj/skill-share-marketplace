import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Task, UserRole } from '../types'; 
import { useAuth } from '../context/AuthContext'; 

type TaskStatusString = 'open' | 'assigned' | 'in_progress' | 'completed_pending_review' | 'closed' | 'cancelled' | 'rejected';

interface TaskCardProps {
    task: Task;
    showActions?: boolean; 
    onMakeOffer?: (taskId: string) => void;
    onViewOffers?: (taskId: string) => void; // For task owner to view offers
    onEdit?: (taskId: string) => void; // For task owner to edit
    onViewProgress?: (taskId: string) => void; // For task owner/provider to view progress
    onAddTaskProgress?: (taskId: string) => void; // For the assigned provider to add new progress updates
    onAcceptCompletion?: (taskId: string) => void; // for requester to accept completion
    onRejectCompletion?: (taskId: string) => void; // for requester to reject completion
    children?: ReactNode;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    showActions = true,
    onMakeOffer,
    onViewOffers,
    onEdit,
    onViewProgress,
    onAddTaskProgress,
    onAcceptCompletion, 
    onRejectCompletion, 
}) => {
    const { user } = useAuth(); // Get the current authenticated user

    const isRequester = user && user.role === UserRole.Requester;
    const isProvider = user && user.role === UserRole.Provider;

    // Helper to get status display text
    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case 'open': return 'Open';
            case 'assigned': return 'Assigned';
            case 'in_progress': return 'In Progress';
            case 'completed_pending_review': return 'Completion Requested'; // New status display
            case 'closed': return 'Completed'; // Final state after acceptance
            case 'cancelled': return 'Cancelled';
            case 'rejected': return 'Rejected (Needs Rework)'; // New status display after rejection
            default: return status.replace(/_/g, ' '); // Fallback for other or undefined statuses
        }
    };

    // Helper to get status color class
    const getStatusColorClass = (status: string): string => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'assigned': return 'bg-purple-100 text-purple-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed_pending_review': return 'bg-yellow-100 text-yellow-800'; // Highlight pending review
            case 'closed': return 'bg-gray-200 text-gray-700'; // Completed/Closed tasks
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'rejected': return 'bg-red-100 text-red-800'; // Rejected tasks
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
            <div className={`text-sm font-semibold py-1 px-3 rounded-full inline-block ${getStatusColorClass(task.status as TaskStatusString)}`}>
                Status: {getStatusDisplay(task.status as TaskStatusString)}
            </div>

            {showActions && (
                <div className="mt-4 flex flex-wrap gap-2">

                    {isRequester && (
                        <>
                            {task.status === 'completed_pending_review' && (
                                <>
                                    {onAcceptCompletion && (
                                        <button
                                            onClick={() => onAcceptCompletion(task.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                        >
                                            Accept Completion
                                        </button>
                                    )}
                                    {onRejectCompletion && (
                                        <button
                                            onClick={() => onRejectCompletion(task.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                        >
                                            Reject Completion
                                        </button>
                                    )}
                                </>
                            )}

                            {task.status !== 'completed_pending_review' && (
                                <>
                                    {onEdit && (task.status === 'open' || task.status === 'rejected') && (
                                        <button
                                            onClick={() => onEdit(task.id)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                        >
                                            Edit Task
                                        </button>
                                    )}
                                    {onViewOffers && task.status === 'open' && (
                                        <button
                                            onClick={() => onViewOffers(task.id)}
                                            className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                        >
                                            View Offers
                                        </button>
                                    )}
                                    {onViewProgress && (task.status === 'assigned' || task.status === 'in_progress') && (
                                        <button
                                            onClick={() => onViewProgress(task.id)}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                        >
                                            View Progress
                                        </button>
                                    )}
                                    {/* View Details for Requester: visible for completed/rejected or cancelled tasks */}
                                    {(task.status === 'closed' || task.status === 'rejected' || task.status === 'cancelled') && (
                                        <Link href={`/dashboard/tasks/${task.id}`} className="flex-grow">
                                            <button
                                                className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                                            >
                                                View Details
                                            </button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {isProvider && (
                        <>
                            {onAddTaskProgress && task.status === 'in_progress' && (
                                <button
                                    onClick={() => onAddTaskProgress(task.id)}
                                    className="bg-teal-500 hover:bg-teal-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                                >
                                    Add New Progress
                                </button>
                            )}
                           
                        </>
                    )}

                    {onMakeOffer && task.status === 'open' && isProvider && (
                        <button
                            onClick={() => onMakeOffer(task.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200 flex-grow"
                        >
                            Make Offer
                        </button>
                    )}

                    {!isRequester && !isProvider && (task.status === 'open' || task.status === 'closed') && (
                        <Link href={`/tasks/${task.id}`} className="flex-grow">
                            <button
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                            >
                                View Task
                            </button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskCard;