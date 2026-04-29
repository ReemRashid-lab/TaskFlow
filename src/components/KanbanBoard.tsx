import React from 'react';
import { motion } from 'framer-motion';

interface KanbanBoardProps {
  tasks: any[];
  renderCard: (task: any) => React.ReactNode;
}

const COLUMNS = [
  { id: 'Pending', label: 'To Do', color: 'bg-slate-100 text-slate-600' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-blue-100 text-blue-600' },
  { id: 'Needs Resubmission', label: 'Revision', color: 'bg-orange-100 text-orange-600' },
  { id: 'Completed', label: 'Done', color: 'bg-green-100 text-green-600' },
];

export default function KanbanBoard({ tasks, renderCard }: KanbanBoardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-6 min-h-[500px]">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex-1 min-w-[300px] flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${column.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
              <h3 className="font-bold text-sm uppercase tracking-wider">{column.label}</h3>
            </div>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {tasks.filter(t => t.status === column.id).length}
            </span>
          </div>

          <div className="flex-1 bg-muted/30 rounded-xl p-3 border border-dashed border-border space-y-4">
            {tasks.filter(t => t.status === column.id).length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-xs italic border border-dashed border-border rounded-lg">
                No tasks
              </div>
            ) : (
              tasks.filter(t => t.status === column.id).map((task) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderCard(task)}
                </motion.div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
