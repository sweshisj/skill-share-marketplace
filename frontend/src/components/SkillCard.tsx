import React from 'react';
import { Skill } from '../types'; 

interface SkillCardProps {
    skill: Skill;
    showActions?: boolean;
    onEdit?: (skillId: string) => void;
    onDelete?: (skillId: string) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, showActions = true, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-xl font-bold mb-2 text-gray-800">{skill.category}</h3>
            <p className="text-gray-700 mb-2 text-sm">Experience: <span className="font-medium">{skill.experience}</span></p>
            <p className="text-gray-700 mb-4 text-sm">Nature of Work: <span className="font-medium">{skill.natureOfWork}</span></p>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span>Rate: <span className="font-semibold">{skill.hourlyRate} {skill.rateCurrency}/hr</span></span>
            </div>

            {showActions && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(skill.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Edit Skill
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(skill.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Delete Skill
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SkillCard;