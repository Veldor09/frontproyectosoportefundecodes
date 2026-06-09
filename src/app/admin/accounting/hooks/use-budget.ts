// src/app/admin/contabilidad/hooks/useBudget.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { BudgetItem } from "../types";
import { BudgetService } from "../services/budget-service";

/**
 * Hook para gestionar presupuestos:
 * - Obtiene, crea y actualiza presupuestos
 * - Permite refetch manual
 */
export function useBudget(filters?: Partial<BudgetItem>) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** 🔄 Obtener presupuestos */
  const fetchBudgetItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await BudgetService.getBudgetItems(filters);
      setBudgetItems(items);
    } catch (err) {
      console.error("Error al cargar los presupuestos:", err);
      setError("Error al cargar los datos del presupuesto");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /** ✏️ Actualizar un presupuesto */
  const updateBudgetItem = useCallback(
    async (id: string, updates: Partial<BudgetItem>) => {
      try {
        await BudgetService.updateBudgetItem(id, updates);
        await fetchBudgetItems();
        return { success: true, message: "Presupuesto actualizado correctamente" };
      } catch (err) {
        console.error("Error al actualizar presupuesto:", err);
        return { success: false, message: "Error al actualizar el presupuesto" };
      }
    },
    [fetchBudgetItems]
  );

  /** ➕ Crear un nuevo presupuesto */
  const createBudgetItem = useCallback(
    async (item: Omit<BudgetItem, "id" | "fechaCreacion" | "fechaActualizacion">) => {
      try {
        await BudgetService.createBudgetItem(item);
        await fetchBudgetItems();
        return { success: true, message: "Presupuesto creado correctamente" };
      } catch (err) {
        console.error("Error al crear presupuesto:", err);
        return { success: false, message: "Error al crear el presupuesto" };
      }
    },
    [fetchBudgetItems]
  );

  /** 🔁 Cargar automáticamente al montar o cambiar filtros */
  useEffect(() => {
    fetchBudgetItems();
  }, [fetchBudgetItems]);

  return {
    budgetItems,
    loading,
    error,
    updateBudgetItem,
    createBudgetItem,
    refetch: fetchBudgetItems,
  };
}
