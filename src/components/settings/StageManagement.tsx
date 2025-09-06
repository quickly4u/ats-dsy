import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Save, 
  X, 
  AlertTriangle,
  Move
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CustomStage } from '../../types';
import { useCustomStages } from '../../hooks/useCustomStages';
import StageTreeCanvas from '../common/StageTreeCanvas';

interface StageManagementProps {
  companyId: string;
}

interface StageFormData {
  name: string;
  description: string;
  color: string;
  stageType: string;
  parentId?: string | null;
}

const STAGE_COLORS = [
  { value: 'bg-blue-500', label: 'Blue', color: '#3B82F6' },
  { value: 'bg-green-500', label: 'Green', color: '#10B981' },
  { value: 'bg-yellow-500', label: 'Yellow', color: '#F59E0B' },
  { value: 'bg-red-500', label: 'Red', color: '#EF4444' },
  { value: 'bg-purple-500', label: 'Purple', color: '#8B5CF6' },
  { value: 'bg-indigo-500', label: 'Indigo', color: '#6366F1' },
  { value: 'bg-pink-500', label: 'Pink', color: '#EC4899' },
  { value: 'bg-orange-500', label: 'Orange', color: '#F97316' },
  { value: 'bg-teal-500', label: 'Teal', color: '#14B8A6' },
  { value: 'bg-gray-500', label: 'Gray', color: '#6B7280' },
];

const STAGE_TYPES = [
  { value: 'application', label: 'Application' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'review', label: 'Review' },
  { value: 'offer', label: 'Offer' },
  { value: 'custom', label: 'Custom' },
];

interface SortableStageItemProps {
  stage: CustomStage;
  onEdit: (stage: CustomStage) => void;
  onDelete: (stageId: string) => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({ stage, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorObj = STAGE_COLORS.find(c => c.value === stage.color);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={20} />
        </div>
        
        <div className="flex items-center space-x-3">
          <div 
            className={`w-4 h-4 rounded-full ${stage.color}`}
            style={{ backgroundColor: colorObj?.color }}
          ></div>
          <div>
            <h4 className="font-medium text-gray-900">{stage.name}</h4>
            {stage.description && (
              <p className="text-sm text-gray-500">{stage.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {STAGE_TYPES.find(t => t.value === stage.stageType)?.label || stage.stageType}
          </span>
          {stage.isDefault && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              Default
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(stage)}
          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
        >
          <Edit size={16} />
        </button>
        {stage.canBeDeleted && (
          <button
            onClick={() => onDelete(stage.id)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const StageManagement: React.FC<StageManagementProps> = ({ companyId }) => {
  const { 
    stages, 
    isLoading, 
    error, 
    createStage, 
    updateStage, 
    deleteStage, 
    reorderStages 
  } = useCustomStages(companyId);
  
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<CustomStage | null>(null);
  const [formData, setFormData] = useState<StageFormData>({
    name: '',
    description: '',
    color: 'bg-blue-500',
    stageType: 'custom',
    parentId: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = stages.findIndex((item) => item.id === active.id);
      const newIndex = stages.findIndex((item) => item.id === over?.id);
      
      const newItems = arrayMove(stages, oldIndex, newIndex);
      const stageIds = newItems.map(item => item.id);
      
      // Update order in database
      reorderStages(stageIds).catch(err => {
        console.error('Failed to reorder stages:', err);
      });
    }
  };

  const handleAddStage = () => {
    setEditingStage(null);
    setFormData({
      name: '',
      description: '',
      color: 'bg-blue-500',
      stageType: 'custom',
      parentId: null
    });
    setShowForm(true);
  };

  const handleEditStage = (stage: CustomStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || '',
      color: stage.color,
      stageType: stage.stageType,
      parentId: stage.parentId ?? null
    });
    setShowForm(true);
  };

  const handleSaveStage = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingStage) {
        // Update existing stage
        await updateStage(editingStage.id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
          stageType: formData.stageType,
          parentId: formData.parentId ?? null,
        });
      } else {
        // Add new stage
        const newStageData: Omit<CustomStage, 'id' | 'createdAt' | 'updatedAt'> = {
          companyId,
          ...formData,
          orderIndex: stages.length + 1,
          isDefault: false,
          isActive: true,
          canBeDeleted: true
        };
        await createStage(newStageData);
      }

      setShowForm(false);
      setEditingStage(null);
    } catch (err) {
      console.error('Failed to save stage:', err);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      await deleteStage(stageId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete stage:', err);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStage(null);
    setFormData({
      name: '',
      description: '',
      color: 'bg-blue-500',
      stageType: 'custom',
      parentId: null
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Stages</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Pipeline Stages</h3>
          <p className="text-sm text-gray-500 mt-1">
            Customize your recruitment pipeline stages. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-2 text-sm ${viewMode === 'tree' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              Tree
            </button>
          </div>
          <button
            onClick={handleAddStage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Stage</span>
          </button>
        </div>
      </div>

      {/* Stage Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {editingStage ? 'Edit Stage' : 'Add New Stage'}
              </h4>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technical Interview"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description of this stage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {STAGE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.value} ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : 'hover:ring-2 hover:ring-offset-2 hover:ring-gray-300'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage Type
                </label>
                <select
                  value={formData.stageType}
                  onChange={(e) => setFormData({ ...formData, stageType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STAGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Stage (optional)
                </label>
                <select
                  value={formData.parentId ?? ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? e.target.value : null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent</option>
                  {stages
                    .filter(s => !editingStage || s.id !== editingStage.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Parent-child defines allowed forward jumps from a stage.</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStage}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{editingStage ? 'Update' : 'Add'} Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h4 className="text-lg font-medium text-gray-900">Delete Stage</h4>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this stage? This action cannot be undone and may affect existing applications.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStage(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stages View */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {stages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  onEdit={handleEditStage}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <StageTreeCanvas
          stages={stages}
          onEdit={handleEditStage}
          onDelete={(id) => setDeleteConfirm(id)}
          onMove={async (stageId, newParentId) => {
            try {
              await updateStage(stageId, { parentId: newParentId });
            } catch (err) {
              console.error('Failed to move stage:', err);
            }
          }}
        />
      )}

      {stages.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Move className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stages configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first pipeline stage.
          </p>
          <button
            onClick={handleAddStage}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Stage
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Stage Management Tips
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag stages to reorder your pipeline</li>
                <li>Default stages cannot be deleted but can be edited</li>
                <li>Applications will follow the stage order you define</li>
                <li>Changes apply to all future applications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageManagement;
