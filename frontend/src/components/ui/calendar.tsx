import React from 'react';

export function Calendar() {
  return (
    <div className="p-4 border rounded">
      <div className="text-center font-medium mb-4">
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs text-gray-500">
            {day}
          </div>
        ))}
        {Array(35).fill(null).map((_, i) => (
          <div key={i} className="h-8 w-8 text-center text-sm flex items-center justify-center">
            {i + 1 <= 30 ? i + 1 : ""}
          </div>
        ))}
      </div>
    </div>
  );
} 