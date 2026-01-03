"use client";

import React, { useEffect, useState } from 'react';
import { ProjectCard } from '@/components/ProjectCard';

interface Project {
  id: number;
  name: string;
  description: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration since the backend isn't reachable in the build environment
  // In a real app, this would be a fetch call to process.env.NEXT_PUBLIC_API_URL
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProjects([
        { id: 1, name: "Autonomous Driving V2", description: "Curated dataset for L4 autonomy including synthetic fog scenarios." },
        { id: 2, name: "Medical Imaging Analysis", description: "X-Ray classification dataset with anomaly detection scores." },
        { id: 3, name: "Retail Object Detection", description: "SKU recognition for automated checkout systems." }
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-500 mt-2">Manage your data workspaces</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Project
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              datasetCount={Math.floor(Math.random() * 10) + 1} // Mock count
            />
          ))}
        </div>
      )}
    </div>
  );
}
