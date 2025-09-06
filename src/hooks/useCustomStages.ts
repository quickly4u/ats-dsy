import { useState, useEffect } from 'react';
import type { CustomStage } from '../types';
import { supabase } from '../lib/supabase';

interface UseCustomStagesReturn {
  stages: CustomStage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createStage: (stage: Omit<CustomStage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStage: (id: string, updates: Partial<CustomStage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  reorderStages: (stageIds: string[]) => Promise<void>;
}

export const useCustomStages = (companyId: string): UseCustomStagesReturn => {
  const [stages, setStages] = useState<CustomStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('custom_stages')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const formattedStages: CustomStage[] = (data || []).map(stage => ({
        id: stage.id,
        companyId: stage.company_id,
        parentId: stage.parent_id,
        name: stage.name,
        description: stage.description,
        color: stage.color,
        orderIndex: stage.order_index,
        stageType: stage.stage_type,
        isDefault: stage.is_default,
        isActive: stage.is_active,
        canBeDeleted: stage.can_be_deleted,
        createdAt: new Date(stage.created_at),
        updatedAt: new Date(stage.updated_at)
      }));

      setStages(formattedStages);
    } catch (err) {
      console.error('Error fetching custom stages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stages');
    } finally {
      setIsLoading(false);
    }
  };

  const createStage = async (stageData: Omit<CustomStage, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error: insertError } = await supabase
        .from('custom_stages')
        .insert({
          company_id: stageData.companyId,
          parent_id: stageData.parentId ?? null,
          name: stageData.name,
          description: stageData.description,
          color: stageData.color,
          order_index: stageData.orderIndex,
          stage_type: stageData.stageType,
          is_default: stageData.isDefault,
          is_active: stageData.isActive,
          can_be_deleted: stageData.canBeDeleted
        });

      if (insertError) {
        throw insertError;
      }

      await fetchStages();
    } catch (err) {
      console.error('Error creating stage:', err);
      throw err;
    }
  };

  const updateStage = async (id: string, updates: Partial<CustomStage>) => {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;
      if (updates.stageType !== undefined) updateData.stage_type = updates.stageType;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;

      const { error: updateError } = await supabase
        .from('custom_stages')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchStages();
    } catch (err) {
      console.error('Error updating stage:', err);
      throw err;
    }
  };

  const deleteStage = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('custom_stages')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchStages();
    } catch (err) {
      console.error('Error deleting stage:', err);
      throw err;
    }
  };

  const reorderStages = async (stageIds: string[]) => {
    try {
      // Two-phase reorder to avoid unique constraint conflicts on (company_id, order_index)
      // Phase 1: move all affected rows to a high temp range to prevent collisions
      for (let i = 0; i < stageIds.length; i++) {
        const id = stageIds[i];
        await supabase
          .from('custom_stages')
          .update({ order_index: 1000 + i + 1 })
          .eq('id', id)
          .eq('company_id', companyId);
      }

      // Phase 2: assign final sequential positions
      for (let i = 0; i < stageIds.length; i++) {
        const id = stageIds[i];
        await supabase
          .from('custom_stages')
          .update({ order_index: i + 1 })
          .eq('id', id)
          .eq('company_id', companyId);
      }

      await fetchStages();
    } catch (err) {
      console.error('Error reordering stages:', err);
      throw err;
    }
  };

  const refetch = () => {
    fetchStages();
  };

  useEffect(() => {
    if (companyId) {
      fetchStages();
    }
  }, [companyId]);

  return {
    stages,
    isLoading,
    error,
    refetch,
    createStage,
    updateStage,
    deleteStage,
    reorderStages
  };
};
