import React, { useState } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application, CustomStage } from '../../types';
import { useCustomStages } from '../../hooks/useCustomStages';

interface ApplicationPipelineProps {
  applications: Application[];
  isLoading: boolean;
  companyId: string;
  onApplicationMove?: (applicationId: string, newStage: string) => void;
  onViewDetails?: (applicationId: string) => void;
}

interface DraggableApplicationCardProps {
  application: Application;
  onViewDetails?: (applicationId: string) => void;
}

interface DroppableStageProps {
  stage: CustomStage;
  applications: Application[];
  children: React.ReactNode;
  canAcceptDrop?: boolean;
}

const DroppableStage: React.FC<DroppableStageProps> = ({ stage, applications, children, canAcceptDrop = true }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    disabled: !canAcceptDrop,
  });

  const getDropZoneStyle = () => {
    if (!canAcceptDrop) {
      return 'bg-gray-50 opacity-50';
    }
    if (isOver) {
      return canAcceptDrop ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-red-50 ring-2 ring-red-300';
    }
    return 'bg-gray-50';
  };

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-lg p-4 min-h-[500px] transition-colors ${getDropZoneStyle()}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
          <h3 className="font-medium text-gray-900">{stage.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
            {applications.length}
          </span>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <Plus size={16} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

const DraggableApplicationCard: React.FC<DraggableApplicationCardProps> = ({ application, onViewDetails }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Profile picture commented out as requested */}
          {/* <img
            src={application.candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2`}
            alt={`${application.candidate.firstName} ${application.candidate.lastName}`}
            className="w-8 h-8 rounded-full object-cover"
          /> */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {application.candidate.firstName} {application.candidate.lastName}
            </h4>
            <p className="text-xs text-gray-500">
              {application.job.title}
            </p>
          </div>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <MoreVertical size={14} />
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        Applied {new Intl.DateTimeFormat('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }).format(application.appliedAt)}
      </div>
      
      {application.candidate.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {application.candidate.skills.slice(0, 2).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {skill}
            </span>
          ))}
          {application.candidate.skills.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{application.candidate.skills.length - 2}
            </span>
          )}
        </div>
      )}
      
      {application.score && (
        <div className="mt-2 text-xs">
          <span className="text-gray-500">Score: </span>
          <span className="font-medium text-gray-900">{application.score}/100</span>
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onViewDetails?.(application.id)}
          className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({ applications, isLoading, companyId, onApplicationMove, onViewDetails }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localApplications, setLocalApplications] = useState<Application[]>(applications);
  
  // Fetch custom stages for the company
  const { stages, isLoading: stagesLoading } = useCustomStages(companyId);

  // Update local state when props change
  React.useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build helper maps for fast lookups
  const nameToStage = React.useMemo(() => {
    const m = new Map<string, CustomStage>();
    for (const s of stages) m.set(s.name, s);
    return m;
  }, [stages]);

  const childrenByParent = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of stages) {
      if (s.parentId) {
        const arr = m.get(s.parentId) || [];
        arr.push(s.id);
        m.set(s.parentId, arr);
      }
    }
    return m;
  }, [stages]);

  const hasHierarchy = React.useMemo(() => stages.some(s => s.parentId), [stages]);

  // Validate stage progression using parent-child when present; otherwise fallback to orderIndex forward-only
  const isValidStageTransition = (fromStageName: string, toStageName: string): boolean => {
    if (fromStageName === toStageName) return true;
    const from = nameToStage.get(fromStageName);
    const to = nameToStage.get(toStageName);
    if (!from || !to) return false;
    if (!hasHierarchy) {
      return to.orderIndex >= from.orderIndex;
    }
    const children = childrenByParent.get(from.id) || [];
    return children.includes(to.id);
  };

  // Group applications by stage
  const applicationsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = localApplications.filter(app => app.currentStage.name === stage.name);
    return acc;
  }, {} as Record<string, Application[]>);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Helper function to determine if a stage can accept the currently dragged application
  const canStageAcceptDrop = (stage: CustomStage, draggedApp: Application | null): boolean => {
    if (!draggedApp) return true;
    return isValidStageTransition(draggedApp.currentStage.name, stage.name);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the application being dragged
    const draggedApplication = localApplications.find(app => app.id === activeId);
    if (!draggedApplication) return;

    // Determine target stage
    let targetStage = null;
    
    // Check if dropping directly on a stage
    if (overId.startsWith('stage-')) {
      const stageId = overId.replace('stage-', '');
      targetStage = stages.find(stage => stage.id === stageId);
    } else {
      // If dropping on another application, find which stage that application belongs to
      const targetApplication = localApplications.find(app => app.id === overId);
      if (targetApplication) {
        targetStage = stages.find(stage => stage.name === targetApplication.currentStage.name);
      }
    }

    if (targetStage && draggedApplication.currentStage.name !== targetStage.name) {
      // Validate the stage transition
      if (!isValidStageTransition(draggedApplication.currentStage.name, targetStage.name)) {
        // Show a brief notification or feedback for invalid move
        console.warn(`Invalid stage transition: ${draggedApplication.currentStage.name} → ${targetStage.name}`);
        return;
      }

      // Update the application's stage
      const updatedApplications = localApplications.map(app => {
        if (app.id === activeId) {
          return {
            ...app,
            currentStage: {
              ...app.currentStage,
              name: targetStage.name,
              stageType: targetStage.name.toLowerCase().replace(' ', '_') as any
            }
          };
        }
        return app;
      });

      setLocalApplications(updatedApplications);
      
      // Call the callback if provided
      if (onApplicationMove) {
        onApplicationMove(activeId, targetStage.name);
      }
    }
  };

  const activeApplication = activeId ? localApplications.find(app => app.id === activeId) : null;



  if (isLoading || stagesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 mb-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {stages.map((stage) => {
          const stageApplications = applicationsByStage[stage.id] || [];
          const draggedApp = activeId ? localApplications.find(app => app.id === activeId) || null : null;
          const canAcceptDrop = canStageAcceptDrop(stage, draggedApp);
          
          return (
            <DroppableStage 
              key={stage.id}
              stage={stage}
              applications={stageApplications}
              canAcceptDrop={canAcceptDrop}
            >
              <SortableContext 
                items={stageApplications.map(app => app.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {stageApplications.map((application) => (
                    <DraggableApplicationCard key={application.id} application={application} onViewDetails={onViewDetails} />
                  ))}
                </div>
              </SortableContext>
              
              {stageApplications.length === 0 && (
                <div className={`text-center py-8 border-2 border-dashed rounded-lg ${
                  canAcceptDrop 
                    ? 'text-gray-500 border-gray-300' 
                    : 'text-gray-400 border-gray-200'
                }`}>
                  <p className="text-sm">
                    {canAcceptDrop ? 'Drop applications here' : 'Invalid drop target'}
                  </p>
                </div>
              )}
            </DroppableStage>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeApplication ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-lg rotate-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                {/* Profile picture commented out as requested */}
                {/* <img
                  src={activeApplication.candidate.avatar || `https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=2`}
                  alt={`${activeApplication.candidate.firstName} ${activeApplication.candidate.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                /> */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {activeApplication.candidate.firstName} {activeApplication.candidate.lastName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {activeApplication.job.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ApplicationPipeline;