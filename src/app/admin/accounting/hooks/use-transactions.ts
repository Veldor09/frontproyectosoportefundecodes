// src/app/admin/contabilidad/hooks/useTransactions.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Transaction } from "../types";
import { TransactionService } from "../services/transaction-service";

/**
 * Hook personalizado para gestionar transacciones
 * - Obtiene, crea y elimina transacciones
 * - Calcula totales (ingresos, egresos, balance)
 */
export function useTransactions(filters?: Record<string, any>) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /** 🔄 Obtener lista de transacciones */
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await TransactionService.getTransactions(filters);
      setTransactions(items);
    } catch (err) {
      console.error("Error al cargar transacciones:", err);
      setError("Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /** ➕ Crear transacción */
  const createTransaction = useCallback(
    async (transaction: Omit<Transaction, "id" | "fechaCreacion">) => {
      try {
        await TransactionService.createTransaction(transaction);
        await fetchTransactions();
        return { success: true, message: "Transacción creada correctamente" };
      } catch (err) {
        console.error("Error al crear transacción:", err);
        return { success: false, message: "Error al crear la transacción" };
      }
    },
    [fetchTransactions]
  );

  /** ❌ Eliminar transacción */
  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        await TransactionService.deleteTransaction(id);
        await fetchTransactions();
        return { success: true, message: "Transacción eliminada correctamente" };
      } catch (err) {
        console.error("Error al eliminar transacción:", err);
        return { success: false, message: "Error al eliminar la transacción" };
      }
    },
    [fetchTransactions]
  );

  /** 🧮 Totales calculados */
  const totals = useMemo(() => {
    const ingresos = transactions
      .filter((t) => t.tipo === "ingreso")
      .reduce((sum, t) => sum + t.monto, 0);
    const egresos = transactions
      .filter((t) => t.tipo === "egreso")
      .reduce((sum, t) => sum + t.monto, 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    };
  }, [transactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    totals,
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
