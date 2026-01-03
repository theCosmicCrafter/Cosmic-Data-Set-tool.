
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getDatasets, createDataset } from '@/api/datasets';
import { Layers, Plus, HardDrive, Search, Folder, Calendar, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';

export default function DatasetListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDesc, setNewDatasetDesc] = useState('');

  const { data: datasets, isLoading } = useQuery('datasets', getDatasets);

  const mutation = useMutation(
    (data: { name: string; desc: string }) => createDataset(data.name, data.desc),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('datasets');
        setIsModalOpen(false);
        setNewDatasetName('');
        setNewDatasetDesc('');
      },
    }
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name: newDatasetName, desc: newDatasetDesc });
  };

  return (
    <Layout>
      {/* HUD Toolbar */}
      <div className="flex flex-col gap-4 p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
         <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                 <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                     <Layers className="w-5 h-5 text-indigo-400" />
                 </div>
                 <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                     Datasets
                 </h2>
                 <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                    {datasets?.length || 0} TOTAL
                 </span>
             </div>

             <div className="flex items-center gap-2">
                 <div className="relative group hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search datasets..."
                        className="w-64 bg-slate-950/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                      />
                 </div>
                 <Button variant="cosmic" size="sm" onClick={() => setIsModalOpen(true)}>
                     <Plus className="w-4 h-4 mr-2" />
                     New Dataset
                 </Button>
             </div>
         </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
              <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>
          ) : datasets?.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                   <HardDrive className="w-12 h-12 mb-4 opacity-50" />
                   <p className="text-lg font-medium text-slate-300">No Datasets Found</p>
                   <p className="text-sm mb-4">Create your first dataset to start training.</p>
                   <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Create Dataset</Button>
               </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {datasets?.map((ds) => (
                      <div 
                        key={ds.id} 
                        onClick={() => router.push(`/datasets/${ds.id}`)}
                        className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 transition-all hover:border-indigo-500/50 hover:-translate-y-1 cursor-pointer hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      >
                          <div className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-indigo-500/30">
                                      <Folder className="w-5 h-5 text-indigo-400" />
                                  </div>
                                  <button className="text-slate-600 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                              </div>
                              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{ds.name}</h3>
                              <p className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em]">{ds.description || "No description provided."}</p>
                          </div>
                          <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                               <div className="flex items-center gap-1">
                                   <Calendar className="w-3 h-3" />
                                   {new Date(ds.created_at).toLocaleDateString()}
                               </div>
                               <span className={`px-2 py-0.5 rounded-full ${ds.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800'}`}>
                                   {ds.status.toUpperCase()}
                               </span>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-4">Create New Dataset</h3>
                   <form onSubmit={handleCreate}>
                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                               <input 
                                  autoFocus
                                  type="text" 
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                  value={newDatasetName}
                                  onChange={e => setNewDatasetName(e.target.value)}
                                  required
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                               <textarea 
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                  value={newDatasetDesc}
                                  onChange={e => setNewDatasetDesc(e.target.value)}
                               />
                           </div>
                       </div>
                       <div className="flex justify-end gap-3 mt-6">
                           <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                           <Button type="submit" variant="primary">Create Project</Button>
                       </div>
                   </form>
               </div>
          </div>
      )}
    </Layout>
  );
}
