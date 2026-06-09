'use client';
import React from 'react';

type Props = {
  value?: number;
  onChange: (v: number) => void;
};

export default function MoneyInput({ value, onChange }: Props) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border p-2"
      placeholder="0.00"
    />
  );
}
