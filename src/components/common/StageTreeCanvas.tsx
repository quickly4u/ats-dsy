import React, { useMemo, useRef, useState } from 'react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Edit, Trash2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { CustomStage } from '../../types';

export interface StageTreeCanvasProps {
  stages: CustomStage[];
  onEdit?: (stage: CustomStage) => void;
  onDelete?: (stageId: string) => void;
  onMove?: (stageId: string, newParentId: string | null) => void;
}

// Simple tree data type with layout fields
interface TreeNode extends CustomStage {
  children: TreeNode[];
  x: number; // left
  y: number; // top 
  subtreeWidth: number;
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 80;
const H_GAP = 24; // gap between sibling subtrees
const V_GAP = 80; // gap between depth levels
const PADDING = 24; // canvas padding

function buildTree(stages: CustomStage[]) {
  const map = new Map<string, TreeNode>();
  stages.forEach((s) => map.set(s.id, { ...s, children: [], x: 0, y: 0, subtreeWidth: 0 }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // sort children by orderIndex for deterministic layout
  const sortRec = (n: TreeNode) => {
    n.children.sort((a, b) => a.orderIndex - b.orderIndex);
    n.children.forEach(sortRec);
  };
  roots.sort((a, b) => a.orderIndex - b.orderIndex);
  roots.forEach(sortRec);
  return { roots, map };
}

// Compute layout using a simple tidy algorithm
function layoutTree(roots: TreeNode[]) {
  let currentX = 0;
  const levelHeights: number[] = [];

  const measure = (node: TreeNode, depth: number) => {
    levelHeights[depth] = Math.max(levelHeights[depth] || 0, CARD_HEIGHT);
    if (node.children.length === 0) {
      node.subtreeWidth = CARD_WIDTH;
      return CARD_WIDTH;
    }
    let width = node.children.reduce((acc, child) => acc + measure(child, depth + 1), 0);
    if (node.children.length > 1) width += H_GAP * (node.children.length - 1);
    node.subtreeWidth = Math.max(width, CARD_WIDTH);
    return node.subtreeWidth;
  };

  const place = (node: TreeNode, depth: number, left: number) => {
    // Center parent above its children block; if leaf, place at left
    if (node.children.length === 0) {
      node.x = left + (node.subtreeWidth - CARD_WIDTH) / 2;
    } else {
      // children block left bounds
      let childLeft = left;
      node.children.forEach((child) => {
        place(child, depth + 1, childLeft);
        childLeft += child.subtreeWidth + H_GAP;
      });
      const kidsLeft = left;
      const kidsRight = childLeft - H_GAP;
      const kidsCenter = (kidsLeft + kidsRight - CARD_WIDTH) / 2;
      node.x = Math.max(left, kidsCenter);
      // If parent card would overflow the computed subtree, allow it; subtreeWidth already max'd
    }
    node.y = depth * (CARD_HEIGHT + V_GAP);
  };

  roots.forEach((r) => measure(r, 0));
  currentX = 0;
  roots.forEach((r) => {
    place(r, 0, currentX);
    currentX += r.subtreeWidth + H_GAP;
  });

  const totalWidth = Math.max(currentX - H_GAP, CARD_WIDTH);
  const totalHeight = levelHeights.reduce((acc, h) => acc + h, 0) + (Math.max(levelHeights.length - 1, 0) * V_GAP);
  return { totalWidth, totalHeight };
}

const StageCard: React.FC<{
  node: TreeNode;
  onEdit?: (stage: CustomStage) => void;
  onDelete?: (stageId: string) => void;
}> = ({ node, onEdit, onDelete }) => {
  const { setNodeRef: setDropRef } = useDroppable({ id: `node-${node.id}` });
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: `node-${node.id}` });
  const style: React.CSSProperties = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  return (
    <div
      ref={setDropRef}
      style={{ position: 'absolute', left: node.x + PADDING, top: node.y + PADDING }}
    >
      <div
        ref={setDragRef}
        {...attributes}
        {...listeners}
        style={style}
        className={`bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${node.color}`} />
            <span className="font-medium text-gray-900 truncate" title={node.name}>{node.name}</span>
            {node.isDefault && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Default</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {onEdit && (
              <button onClick={() => onEdit(node)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                <Edit size={14} />
              </button>
            )}
            {onDelete && node.canBeDeleted && (
              <button onClick={() => onDelete(node.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {node.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{node.description}</p>
        )}
      </div>
    </div>
  );
};

const StageTreeCanvas: React.FC<StageTreeCanvasProps> = ({ stages, onEdit, onDelete, onMove }) => {
  const { roots, map: nodeMap } = useMemo(() => buildTree(stages), [stages]);
  const { totalWidth, totalHeight } = useMemo(() => layoutTree(roots), [roots]);
  const contentWidth = totalWidth + PADDING * 2;
  const contentHeight = totalHeight + PADDING * 2;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const { setNodeRef: setRootDropRef } = useDroppable({ id: 'root' });

  // Track viewport size for fit-to-view
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (isCycle(draggedId, newParentId)) return;
    const dragged = nodeMap.get(draggedId);
    if (!dragged) return;
    if ((dragged.parentId || null) === newParentId) return;
    onMove(draggedId, newParentId);
  };

  if (!stages || stages.length === 0) {
    return <div className="text-sm text-gray-500">No stages available.</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div ref={containerRef} className="relative w-full border border-gray-200 rounded-lg overflow-hidden" style={{ height: 480 }}>
        <TransformWrapper
          minScale={0.2}
          maxScale={2}
          wheel={{ step: 0.1 }}
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
          onInit={() => setIsInitialized(true)}
        >
          {({
            zoomIn,
            zoomOut,
            resetTransform,
            setTransform,
          }) => {
            
            const fitToView = () => {
              if (!containerRef.current || !isInitialized) return;
              const { clientWidth, clientHeight } = containerRef.current;
              if (clientWidth === 0 || clientHeight === 0) return;
              
              // Add padding to ensure content doesn't touch edges
              const padding = 40;
              const availableWidth = clientWidth - padding * 2;
              const availableHeight = clientHeight - padding * 2;
              
              const scaleX = availableWidth / contentWidth;
              const scaleY = availableHeight / contentHeight;
              const scale = Math.max(0.2, Math.min(1.5, Math.min(scaleX, scaleY)));
              
              const tx = (clientWidth - contentWidth * scale) / 2;
              const ty = (clientHeight - contentHeight * scale) / 2;
              
              setTransform(tx, ty, scale, 300);
            };
            
            // Auto-fit on first load
            React.useEffect(() => {
              if (isInitialized && contentWidth > 0 && contentHeight > 0) {
                const timer = setTimeout(fitToView, 100);
                return () => clearTimeout(timer);
              }
            }, [isInitialized, contentWidth, contentHeight]);
            return (
              <>
                {/* Controls */}
                <div className="absolute right-2 top-2 z-10 flex gap-1">
                  <button onClick={() => zoomOut()} className="p-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-50" title="Zoom out">
                    <ZoomOut size={16} />
                  </button>
                  <button onClick={() => zoomIn()} className="p-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-50" title="Zoom in">
                    <ZoomIn size={16} />
                  </button>
                  <button onClick={() => resetTransform()} className="p-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-50" title="Reset">
                    ⟲
                  </button>
                  <button onClick={fitToView} className="p-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-gray-50" title="Fit to view">
                    <Maximize size={16} />
                  </button>
                </div>

                <TransformComponent>
                  <div
                    ref={setRootDropRef}
                    style={{ position: 'relative', width: contentWidth, height: contentHeight }}
                  >
                    {/* SVG connectors */}
                    <svg width={contentWidth} height={contentHeight} style={{ display: 'block' }}>
                      {roots.map((r) => (
                        <TreeLinks key={`links-${r.id}`} node={r} />
                      ))}
                    </svg>
                    {/* Node cards overlay */}
                    <div style={{ position: 'absolute', left: 0, top: 0, width: contentWidth, height: contentHeight }}>
                      {roots.map((r) => (
                        <TreeNodes key={`nodes-${r.id}`} node={r} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  </div>
                </TransformComponent>
              </>
            );
          }}
        </TransformWrapper>
      </div>
    </DndContext>
  );
};

const TreeNodes: React.FC<{
  node: TreeNode;
  onEdit?: (stage: CustomStage) => void;
  onDelete?: (stageId: string) => void;
}> = ({ node, onEdit, onDelete }) => {
  return (
    <>
      <StageCard node={node} onEdit={onEdit} onDelete={onDelete} />
      {node.children.map((c) => (
        <TreeNodes key={c.id} node={c} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
};

const TreeLinks: React.FC<{ node: TreeNode }> = ({ node }) => {
  const parentCenterX = node.x + PADDING + CARD_WIDTH / 2;
  const parentBottomY = node.y + PADDING + CARD_HEIGHT;
  return (
    <>
      {node.children.map((c) => {
        const childCenterX = c.x + PADDING + CARD_WIDTH / 2;
        const childTopY = c.y + PADDING;
        // Curved connector (vertical diagonal)
        const midY = (parentBottomY + childTopY) / 2;
        const d = `M ${parentCenterX} ${parentBottomY}
                   C ${parentCenterX} ${midY}, ${childCenterX} ${midY}, ${childCenterX} ${childTopY}`;
        return (
          <g key={`${node.id}-${c.id}`}>
            <path d={d} stroke="#cbd5e1" strokeWidth={2} fill="none" style={{ pointerEvents: 'none' }} />
          </g>
        );
      })}
      {node.children.map((c) => (
        <TreeLinks key={c.id} node={c} />
      ))}
    </>
  );
};

export default StageTreeCanvas;
