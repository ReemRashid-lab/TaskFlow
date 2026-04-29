import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Clock, AlertCircle, CheckCircle2, UploadCloud, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<'refNo' | 'deadline'>('refNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [submitData, setSubmitData] = useState<{file: File | null, staffNotes: string}>({
    file: null, staffNotes: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const loadTasks = async () => {
    try {
      const data = await fetchApi('/tasks');
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetchApi(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadTasks();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitData.file) {
      alert('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload file to local server
      const formData = new FormData();
      formData.append('file', submitData.file);

      // We need to pass the JWT token in fetchApi but for FormData we might need a custom fetch
      // or ensure fetchApi handles FormData. Let's check src/lib/api.ts.
      // Actually fetchApi in src/lib/api.ts intercepts for Firebase. 
      // I should use a direct fetch for the upload to the Express server.
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      formData.append('upload_preset', uploadPreset);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(`File upload failed: ${errorData.error || uploadRes.statusText}`);
      }
      
      const { secure_url: url } = await uploadRes.json();

      // 2. Submit task details to Firestore (via the fetchApi mock)
      try {
        await fetchApi(`/tasks/${selectedTask.id}`, {
          method: 'PUT',
          body: JSON.stringify({ 
            status: 'Completed', 
            fileUrl: url,
            staffNotes: submitData.staffNotes
          }),
        });
      } catch (firestoreErr: any) {
        throw new Error(`Task registration failed: ${firestoreErr.message || 'Firestore error'}`);
      }

      setIsSubmitOpen(false);
      setSelectedTask(null);
      setSubmitData({ file: null, staffNotes: '' });
      loadTasks();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit task');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#d1fae5] text-[#065f46]">Completed</span>;
      case 'In Progress': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#dbeafe] text-[#1e40af]">In Progress</span>;
      case 'Needs Resubmission': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#ffedd5] text-[#9a3412]">Needs Resubmission</span>;
      default: return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#f1f5f9] text-[#64748b]">Pending</span>;
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter !== 'All' && t.status !== filter) return false;
    return true;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'refNo') {
      aVal = parseInt(aVal, 10) || 0;
      bVal = parseInt(bVal, 10) || 0;
    } else if (sortField === 'deadline') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-[#ef4444]';
      case 'Medium': return 'text-[#f97316]';
      case 'Low': return 'text-[#10b981]';
      default: return 'text-[#64748b]';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">My Tasks</h1>
        <p className="text-[#64748b] mt-1 text-sm">View and manage your assigned tasks.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'All' ? 'bg-[#f1f5f9] border-[#94a3b8] text-[#1e293b]' : 'bg-white border-[#e2e8f0] text-[#64748b]'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('Pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Pending' ? 'bg-[#f1f5f9] border-[#94a3b8] text-[#1e293b]' : 'bg-white border-[#e2e8f0] text-[#64748b]'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('In Progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'In Progress' ? 'bg-[#f1f5f9] border-[#94a3b8] text-[#1e293b]' : 'bg-white border-[#e2e8f0] text-[#64748b]'}`}
          >
            In Progress
          </button>
          <button 
            onClick={() => setFilter('Completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Completed' ? 'bg-[#f1f5f9] border-[#94a3b8] text-[#1e293b]' : 'bg-white border-[#e2e8f0] text-[#64748b]'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setFilter('Needs Resubmission')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Needs Resubmission' ? 'bg-[#f1f5f9] border-[#94a3b8] text-[#1e293b]' : 'bg-white border-[#e2e8f0] text-[#64748b]'}`}
          >
            Needs Resubmission
          </button>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={sortField} 
            onChange={(e: any) => setSortField(e.target.value)}
            className="w-full sm:w-[130px] h-8 text-xs bg-white border border-[#e2e8f0] rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <option value="refNo">Sort By: Ref No</option>
            <option value="deadline">Sort By: Deadline</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 text-xs font-semibold rounded-md border bg-white border-[#e2e8f0] text-[#64748b] hover:bg-slate-50 flex items-center justify-center"
            title="Toggle Sort Order"
          >
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#e2e8f0]">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[0.7rem] font-mono text-[#64748b]">{task.refNo}</span>
                {getStatusBadge(task.status)}
              </div>
              <h3 className="text-base font-bold text-[#1e293b]">{task.title}</h3>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <p className="text-[0.825rem] text-[#64748b] line-clamp-2">{task.description}</p>
              
              <div className="space-y-2 text-[0.825rem]">
                <div className="flex items-center text-[#64748b]">
                  <Clock className="mr-2 h-4 w-4" />
                  Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center text-[#64748b]">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Priority: <span className={`ml-1 font-semibold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                </div>
                {task.managerNotes && (
                  <div className="mt-3 p-3 bg-[#eff6ff] border border-[#dbeafe] rounded-lg">
                    <div className="flex items-center text-[#1e40af] font-bold text-[0.7rem] mb-1">
                      <MessageSquare className="mr-2 h-3.5 w-3.5" /> FEEDBACK FROM MANAGER
                    </div>
                    <p className="text-[0.825rem] text-[#1e3a8a] italic">"{task.managerNotes}"</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-between">
              {task.status === 'Pending' && (
                <button className="w-full py-2 px-4 bg-white border border-[#e2e8f0] text-[#1e293b] text-sm font-semibold rounded-md hover:bg-[#f1f5f9] transition-colors" onClick={() => handleStatusChange(task.id, 'In Progress')}>
                  Start Task
                </button>
              )}
              {(task.status === 'In Progress' || task.status === 'Needs Resubmission') && (
                task.type === 'Upload' ? (
                  <button 
                    className="w-full py-2 px-4 bg-[#3b82f6] text-white text-sm font-semibold rounded-md hover:bg-[#2563eb] transition-colors flex items-center justify-center" 
                    onClick={() => {
                      setSelectedTask(task);
                      setSubmitData({ file: null, staffNotes: task.staffNotes || '' });
                      setIsSubmitOpen(true);
                    }}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> {task.status === 'Needs Resubmission' ? 'Resubmit' : 'Submit'} Work
                  </button>
                ) : (
                  <button 
                    className="w-full py-2 px-4 bg-[#10b981] text-white text-sm font-semibold rounded-md hover:bg-[#059669] transition-colors flex items-center justify-center" 
                    onClick={() => handleStatusChange(task.id, 'Completed')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Done
                  </button>
                )
              )}
              {task.status === 'Completed' && (
                <button className="w-full py-2 px-4 bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46] text-sm font-semibold rounded-md flex items-center justify-center cursor-not-allowed" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submitted
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#64748b] bg-white rounded-xl border border-dashed border-[#e2e8f0]">
            No tasks assigned to you yet.
          </div>
        )}
      </div>

      {/* Submit Task Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task: {selectedTask?.refNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File (PDF, DOCX, PPTX, etc.)</Label>
              <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-[#e2e8f0] border-dashed rounded-md hover:border-[#3b82f6] transition-colors cursor-pointer bg-[#f8fafc] group">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-[#94a3b8] group-hover:text-[#3b82f6]" />
                  <div className="flex text-sm text-[#64748b]">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-[#3b82f6] hover:text-[#2563eb]">
                      <span>{submitData.file ? submitData.file.name : 'Upload a file'}</span>
                      <input 
                        id="file-upload" 
                        name="file" 
                        type="file" 
                        className="sr-only" 
                        onChange={e => setSubmitData({...submitData, file: e.target.files ? e.target.files[0] : null})}
                        required={!submitData.file}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-[#94a3b8]">Up to 10MB</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffNotes">Comments</Label>
              <Textarea 
                id="staffNotes" 
                placeholder="Add any notes for the manager..."
                value={submitData.staffNotes} 
                onChange={e => setSubmitData({...submitData, staffNotes: e.target.value})} 
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <button type="button" disabled={isUploading} className="w-full sm:w-auto px-4 py-2 bg-white border border-[#e2e8f0] text-[#1e293b] text-sm font-semibold rounded-md hover:bg-[#f1f5f9] transition-colors disabled:opacity-50" onClick={() => setIsSubmitOpen(false)}>Cancel</button>
              <button type="submit" disabled={isUploading} className="w-full sm:w-auto px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors flex justify-center items-center disabled:opacity-50">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : 'Submit Task'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
