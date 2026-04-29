import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, Search, Filter, Trash2, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { sendTaskAssignmentEmail } from '../lib/email';
import AnalyticsSummary from '../components/AnalyticsSummary';
import KanbanBoard from '../components/KanbanBoard';
import { LayoutGrid, List, Clock, AlertCircle } from 'lucide-react';

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [newTask, setNewTask] = useState({
    title: '', description: '', deadline: '', priority: 'Medium', assignedTo: '', type: 'Simple'
  });
  const [reviewNotes, setReviewNotes] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'refNo' | 'deadline'>('refNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadData = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        fetchApi('/tasks'),
        fetchApi('/users')
      ]);
      setTasks(tasksData as any[]);
      setUsers((usersData as any[]).filter((u: any) => u.role === 'Staff'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
      });
      setIsAssignOpen(false);
      setNewTask({ title: '', description: '', deadline: '', priority: 'Medium', assignedTo: '', type: 'Simple' });
      loadData();
    } catch (err) {
      alert('Failed to assign task');
    }
  };

  const handleReviewTask = async (status: string) => {
    try {
      await fetchApi(`/tasks/${selectedTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, managerNotes: reviewNotes }),
      });
      setIsReviewOpen(false);
      setSelectedTask(null);
      setReviewNotes('');
      loadData();
    } catch (err) {
      alert('Failed to review task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetchApi(`/tasks/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter !== 'All' && t.status !== filter) return false;
    if (search && !t.staffName.toLowerCase().includes(search.toLowerCase()) && !t.refNo.toLowerCase().includes(search.toLowerCase())) return false;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#d1fae5] text-[#065f46]">Completed</span>;
      case 'In Progress': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#dbeafe] text-[#1e40af]">In Progress</span>;
      case 'Needs Resubmission': return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#ffedd5] text-[#9a3412]">Needs Resubmission</span>;
      default: return <span className="px-2 py-1 rounded-full text-[0.7rem] font-semibold bg-[#f1f5f9] text-[#64748b]">Pending</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-destructive';
      case 'Medium': return 'text-orange-500';
      case 'Low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const renderTaskCard = (task: any) => (
    <div key={task.id} className="bg-card rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden h-full transition-colors">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-start mb-2">
          <span className="px-2 py-1 bg-muted border border-border rounded text-[0.7rem] font-mono text-muted-foreground">{task.refNo}</span>
          {getStatusBadge(task.status)}
        </div>
        <h3 className="text-sm font-bold text-foreground line-clamp-1">{task.title}</h3>
        <p className="text-[0.7rem] text-muted-foreground mt-1">Assigned to: <span className="font-semibold">{task.staffName}</span></p>
      </div>
      <div className="p-4 flex-1 space-y-3">
        <div className="space-y-1.5 text-[0.75rem]">
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-3.5 w-3.5" />
            Due: {format(new Date(task.deadline), 'MMM d')}
          </div>
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="mr-2 h-3.5 w-3.5" />
            Priority: <span className={`ml-1 font-semibold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-muted/50 border-t border-border flex justify-end gap-2">
        <button 
          className="text-primary hover:underline font-semibold text-[0.7rem]"
          onClick={() => {
            setSelectedTask(task);
            setReviewNotes(task.managerNotes || '');
            setIsReviewOpen(true);
          }}
        >
          Review
        </button>
        <button 
          className="text-destructive hover:text-red-600 transition-colors"
          onClick={() => handleDeleteTask(task.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Manager Dashboard</h1>
          <p className="text-[#64748b] mt-1 text-sm">Assign and review staff tasks.</p>
        </div>
        <button onClick={() => setIsAssignOpen(true)} className="w-full sm:w-auto px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors flex justify-center items-center">
          <Plus className="mr-2 h-4 w-4" /> Assign Task
        </button>
      </div>

      <AnalyticsSummary tasks={tasks} />

      <div className="bg-white dark:bg-card rounded-xl border border-[#e2e8f0] dark:border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden transition-colors">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="font-bold text-base text-foreground">Task Monitoring</div>
            <div className="flex rounded-md border border-border overflow-hidden">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('board')}
                className={`p-1.5 ${viewMode === 'board' ? 'bg-muted text-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'All' ? 'bg-muted text-foreground border-border transition-colors' : 'bg-card border-border text-muted-foreground transition-colors'}`}
            >
              All Tasks
            </button>
            <button 
              onClick={() => setFilter('Pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Pending' ? 'bg-muted text-foreground border-border transition-colors' : 'bg-card border-border text-muted-foreground transition-colors'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('In Progress')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'In Progress' ? 'bg-muted text-foreground border-border transition-colors' : 'bg-card border-border text-muted-foreground transition-colors'}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setFilter('Completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Completed' ? 'bg-muted text-foreground border-border transition-colors' : 'bg-card border-border text-muted-foreground transition-colors'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter('Needs Resubmission')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${filter === 'Needs Resubmission' ? 'bg-muted text-foreground border-border transition-colors' : 'bg-card border-border text-muted-foreground transition-colors'}`}
            >
              Needs Resubmission
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <Select value={sortField} onValueChange={(val: any) => setSortField(val)}>
              <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs bg-white">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refNo">Ref No</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border bg-card border-border text-muted-foreground transition-colors hover:bg-slate-50 flex items-center justify-center"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>
        </div>
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">Ref No.</th>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">Title</th>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">Assigned To</th>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">Deadline</th>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">Status</th>
                  <th className="bg-muted/50 px-6 py-3 text-[0.7rem] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3.5 text-[0.75rem] font-mono text-muted-foreground border-b border-border">{task.refNo}</td>
                    <td className="px-6 py-3.5 text-[0.825rem] text-foreground border-b border-border font-medium">{task.title}</td>
                    <td className="px-6 py-3.5 text-[0.825rem] text-foreground border-b border-border">{task.staffName}</td>
                    <td className="px-6 py-3.5 text-[0.825rem] text-muted-foreground border-b border-border">{format(new Date(task.deadline), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-3.5 border-b border-border">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-3.5 border-b border-border text-right">
                      <div className="flex justify-end space-x-3">
                        <button 
                          className="text-primary hover:underline font-semibold text-[0.75rem]"
                          onClick={() => {
                            setSelectedTask(task);
                            setReviewNotes(task.managerNotes || '');
                            setIsReviewOpen(true);
                          }}
                        >
                          Review
                        </button>
                        <button 
                          className="text-destructive hover:text-red-600 transition-colors"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No tasks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <KanbanBoard 
              tasks={filteredTasks} 
              renderCard={(task) => renderTaskCard(task)} 
            />
          </div>
        )}
        <div className="mt-auto p-4 bg-muted/50 text-[0.75rem] text-muted-foreground flex justify-between border-t border-border transition-colors">
          <div>Showing {filteredTasks.length} tasks</div>
          <div>System Status: <span className="text-[#10b981]">● Optimal Performance</span></div>
        </div>
      </div>

      {/* Assign Task Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignTask} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select value={newTask.assignedTo} onValueChange={(val) => setNewTask({...newTask, assignedTo: val})} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff">
                      {newTask.assignedTo ? users.find(u => u.id === newTask.assignedTo)?.name : "Select staff"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Task Type</Label>
                <Select value={newTask.type} onValueChange={(val) => setNewTask({...newTask, type: val})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple Task (Just click done)</SelectItem>
                    <SelectItem value="Upload">File Upload Task (PDF, Images, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(val) => setNewTask({...newTask, priority: val})}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
              <button type="button" className="w-full sm:w-auto px-4 py-2 bg-white border border-[#e2e8f0] text-[#1e293b] text-sm font-semibold rounded-md hover:bg-[#f1f5f9] transition-colors" onClick={() => setIsAssignOpen(false)}>Cancel</button>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-md transition-colors">Assign Task</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Task Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Task: {selectedTask?.refNo}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">Staff:</span> {selectedTask.staffName}</div>
                <div><span className="font-semibold">Status:</span> {getStatusBadge(selectedTask.status)}</div>
                <div className="col-span-1 sm:col-span-2"><span className="font-semibold">Title:</span> {selectedTask.title}</div>
              </div>
              
              {selectedTask.fileUrl && (
                <div className="p-3 bg-slate-100 rounded-md text-sm">
                  <span className="font-semibold block mb-1">Submitted File:</span>
                  <a href={selectedTask.fileUrl} target="_blank" rel="noreferrer" className="text-[#3b82f6] hover:underline break-all">
                    {selectedTask.fileUrl}
                  </a>
                </div>
              )}

              {selectedTask.staffNotes && (
                <div className="space-y-1">
                  <Label>Staff Comments</Label>
                  <div className="p-3 bg-slate-50 border rounded-md text-sm text-slate-700">
                    {selectedTask.staffNotes}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="managerNotes">Manager Feedback</Label>
                <Textarea 
                  id="managerNotes" 
                  placeholder="Add feedback for the staff..."
                  value={reviewNotes} 
                  onChange={e => setReviewNotes(e.target.value)} 
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:space-x-2 sm:justify-end">
                <button type="button" className="w-full sm:w-auto px-4 py-2 bg-white border border-[#e2e8f0] text-[#1e293b] text-sm font-semibold rounded-md hover:bg-[#f1f5f9] transition-colors" onClick={() => setIsReviewOpen(false)}>Close</button>
                <button type="button" className="w-full sm:w-auto px-4 py-2 bg-[#fee2e2] text-[#b91c1c] hover:bg-[#fecaca] text-sm font-semibold rounded-md transition-colors" onClick={() => handleReviewTask('Needs Resubmission')}>
                  Request Resubmission
                </button>
                <button type="button" className="w-full sm:w-auto px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-md transition-colors" onClick={() => handleReviewTask('Completed')}>
                  Approve Task
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
