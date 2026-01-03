import React from 'react';

interface ProjectCardProps {
  id: number;
  name: string;
  description: string;
  datasetCount: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ id, name, description, datasetCount }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{name}</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
          ID: {id}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm line-clamp-2">
        {description || "No description provided."}
      </p>
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>{datasetCount} Datasets</span>
      </div>
    </div>
  );
};
