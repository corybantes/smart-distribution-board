"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditableFieldProps {
  label: string;
  value: string;
  fieldKey: string; // The key to update in DB (e.g., 'firstName')
  onSave: (key: string, newValue: string) => Promise<void>;
}

export function EditableField({
  label,
  value,
  fieldKey,
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (tempValue === value) {
      setIsEditing(false); // No changes made
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fieldKey, tempValue);
      setIsEditing(false);
      toast.success(`${label} updated`);
    } catch (error) {
      toast.error("Failed to update");
      setTempValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value); // Reset
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="w-full">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </p>

        {isEditing ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="h-9 max-w-62.5"
              autoFocus
            />
            <Button
              size="icon"
              variant="default"
              className="h-9 w-9 bg-green-600 hover:bg-green-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-red-500"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="font-semibold text-foreground text-base">
              {value || (
                <span className="text-muted-foreground italic text-sm">
                  Not set
                </span>
              )}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-primary"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
