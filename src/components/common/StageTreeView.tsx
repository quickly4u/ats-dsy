import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import type { CustomStage } from '../../types';

export interface StageTypeOption {
  value: string;
  label: string;
}

interface StageTreeViewProps {
  stages: CustomStage[];
  stageTypes?: StageTypeOption[];
  defaultExpanded?: boolean;
  onEdit?: (stage: CustomStage) => void;
  onDelete?: (stageId: string) => void;
  onMove?: (stageId: string, newParentId: string | null) => void;
}

const StageTreeView: React.FC<StageTreeViewProps> = ({
  stages,
  defaultExpanded = true,
  onEdit,
  onDelete,
  onMove,
}) => {

  // Build hierarchical tree when parentId is present
  type TreeNode = CustomStage & { children: TreeNode[] };

  const { roots, nodeMap } = useMemo(() => {
    const map = new Map<string, TreeNode>();
    for (const s of stages) {
      map.set(s.id, { ...s, children: [] });
    }
    const roots: TreeNode[] = [];
    for (const node of map.values()) {
      const pid = node.parentId;
      const parent = pid ? map.get(pid) : undefined;
      if (parent && parent.id !== node.id) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortNodes = (arr: TreeNode[]) => {
      arr.sort((a, b) => a.orderIndex - b.orderIndex);
      arr.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return { roots, nodeMap: map };
  }, [stages]);

  // Expansion state per node (for hierarchical view)
  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setNodeExpanded((prev) => {
      const next: Record<string, boolean> = {};
      for (const id of nodeMap.keys()) {
        next[id] = prev[id] ?? defaultExpanded;
      }
      return next;
    });
  }, [nodeMap, defaultExpanded]);

  const toggleNode = (id: string) => {
    setNodeExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    // Draggable and droppable setup per node
    const { setNodeRef: setDropRef } = useDroppable({ id: `node-${node.id}` });
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: `node-${node.id}` });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
      <div key={node.id} ref={setDropRef} className="space-y-2">
        <div
          className="border border-gray-200 rounded-lg bg-white px-4 py-3 flex items-center justify-between hover:shadow-sm"
          style={{ marginLeft: depth * 16 }}
        >
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => hasChildren && toggleNode(node.id)}
              className={`p-1 -ml-1 ${hasChildren ? 'text-gray-500 hover:text-gray-700' : 'opacity-0 pointer-events-none'}`}
            >
              {hasChildren ? (
                nodeExpanded[node.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            <span
              className={`w-3 h-3 rounded-full ${node.color}`}
              style={{ backgroundColor: undefined }}
            />
            <div ref={setDragRef} style={style} {...attributes} {...listeners} className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{node.name}</span>
                {node.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Default</span>
                )}
              </div>
              {node.description && (
                <p className="text-sm text-gray-500">{node.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(node)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Edit size={16} />
              </button>
            )}
            {onDelete && node.canBeDeleted && (
              <button
                onClick={() => onDelete(node.id)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        {hasChildren && nodeExpanded[node.id] && (
          <div className="mt-2 space-y-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  

  if (!stages || stages.length === 0) {
    return (
      <div className="text-sm text-gray-500">No stages available.</div>
    );
  }

  // DnD setup for hierarchical reparenting
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const { setNodeRef: setRootDropRef } = useDroppable({ id: 'root' });

  const isCycle = (dragId: string, potentialParentId: string | null) => {
    if (!potentialParentId) return false;
    if (dragId === potentialParentId) return true;
    let current = nodeMap.get(potentialParentId);
    while (current) {
      if (current.id === dragId) return true;
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }
    return false;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !onMove) return;
    const draggedId = String(active.id).replace('node-', '');
    let newParentId: string | null = null;
    const overId = String(over.id);
    if (overId.startsWith('node-')) {
      newParentId = overId.replace('node-', '');
    } else if (overId === 'root') {
      newParentId = null;
    } else {
      return;
    }
    // Prevent cycles
    if (isCycle(draggedId, newParentId)) return;
    // No-op if parent unchanged
    const dragged = nodeMap.get(draggedId);
    if (!dragged) return;
    if ((dragged.parentId || null) === newParentId) return;
    onMove(draggedId, newParentId);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={setRootDropRef} className="space-y-3">
        {roots.length === 0 ? (
          <div className="text-sm text-gray-500">No stages available.</div>
        ) : (
          <div className="space-y-2">
            {roots.map((r) => renderNode(r, 0))}
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default StageTreeView;
