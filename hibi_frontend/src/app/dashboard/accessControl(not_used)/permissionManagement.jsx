"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, PlusIcon, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PermissionDialog from './CreatePermission';
import PageHeader from '@/app/components/ReusableComponents/PageHeader';

// Example usage component
const PermissionManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [editingPermission, setEditingPermission] = useState(null);

  const handleSavePermission = (permissionData) => {
    if (editingPermission) {
      // Update existing permission
      setPermissions(permissions.map(p => 
        p.id === editingPermission.id 
          ? { ...p, ...permissionData, id: editingPermission.id } 
          : p
      ));
      setEditingPermission(null);
    } else {
      // Add new permission
      const newPermission = {
        ...permissionData,
        id: Date.now().toString() // Simple ID generation
      };
      setPermissions([...permissions, newPermission]);
    }
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setPermissions(permissions.filter(p => p.id !== id));
  };

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Permissdsion Management"
        rightContent={
          <Button onClick={() => { setIsDialogOpen(true); setEditingPermission(null); }}>
            <PlusIcon /> New Permission
          </Button>
        }
      />

      {permissions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No permissions yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {permissions.map((permission,i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{permission.name}</h3>
                  <p className="text-muted-foreground">{permission.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(permission)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(permission.id)}>
                    Delete
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {permission?.routes?.map((route, index) => (
                  <Badge key={index} variant="secondary" className="font-mono">
                    {route.method} {route.path}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PermissionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSavePermission}
        editingPermission={editingPermission}
      />
    </div>
  );
};

export default PermissionManagement;