"use client"
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Trash2 } from "lucide-react";
import accessControlApi from '@/Apis/AccessControl';

const PermissionDialog = ({ open, onOpenChange, onSave, editingPermission }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRoutes, setSelectedRoutes] = useState([]);
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('available');

    // Reset form when dialog opens or editingPermission changes
    useEffect(() => {
        if (open) {
            if (editingPermission) {
                setName(editingPermission.name || '');
                setDescription(editingPermission.description || '');
                setSelectedRoutes(editingPermission.routes?.length > 0
                    ? [...editingPermission.routes]
                    : []);
                setActiveTab("selected")
            } else {
                resetForm();
            }
            getRoutes();
        }
    }, [open, editingPermission]);

    async function getRoutes() {
        const res = await accessControlApi.getRoute();
        if (res.success) {
            setAvailableRoutes(res.data || []);
        } else {
            setAvailableRoutes([]);
        }
    }

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedRoutes([]);
        setSearchTerm('');
        setErrors({});
        setActiveTab('available');
    };

    const handleRouteSelection = (route, checked) => {
        if (checked) {
            // Add route to selected routes
            setSelectedRoutes([...selectedRoutes, route]);
        } else {
            // Remove route from selected routes
            setSelectedRoutes(selectedRoutes.filter(r => 
                !(r.method === route.method && r.path === route.path)
            ));
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            // Add all filtered routes to selected routes
            const filteredRoutes = filterRoutes(availableRoutes);
            const newSelectedRoutes = [...selectedRoutes];
            
            filteredRoutes.forEach(route => {
                if (!newSelectedRoutes.some(r => 
                    r.method === route.method && r.path === route.path
                )) {
                    newSelectedRoutes.push(route);
                }
            });
            
            setSelectedRoutes(newSelectedRoutes);
        } else {
            // Remove all filtered routes from selected routes
            const filteredRoutes = filterRoutes(availableRoutes);
            const routeIdentifiers = filteredRoutes.map(r => `${r.method}|${r.path}`);
            
            setSelectedRoutes(selectedRoutes.filter(route => 
                !routeIdentifiers.includes(`${route.method}|${route.path}`)
            ));
        }
    };

    const filterRoutes = (routes) => {
        if (!searchTerm) return routes;
        
        return routes.filter(route => 
            route.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
            route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (route.group && route.group.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const getFilteredAvailableRoutes = () => {
        const filtered = filterRoutes(availableRoutes);
        return filtered.filter(route => 
            !selectedRoutes.some(selected => 
                selected.method === route.method && selected.path === route.path
            )
        );
    };

    const getFilteredSelectedRoutes = () => {
        return filterRoutes(selectedRoutes);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Permission name is required';
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (selectedRoutes.length === 0) {
            newErrors.routes = 'At least one route is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave =async () => {
        if (validateForm()) {
            const data={
                name,
                description,
                routes: selectedRoutes
            }
            const res=await accessControlApi.addPermission(data);
            if(res.success)
            {
                console.log(res.data)
            }
            onSave(data);
            onOpenChange(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        onOpenChange(false);
    };

    const isAllSelectedOnCurrentTab = () => {
        if (activeTab === 'available') {
            const filteredAvailable = getFilteredAvailableRoutes();
            return filteredAvailable.length > 0 && filteredAvailable.every(route => 
                selectedRoutes.some(selected => 
                    selected.method === route.method && selected.path === route.path
                )
            );
        } else {
            const filteredSelected = getFilteredSelectedRoutes();
            return filteredSelected.length > 0;
        }
    };

    const RouteItem = ({ route, checked, onCheckedChange }) => (
        <div className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-md">
            <Checkbox 
                checked={checked} 
                onCheckedChange={onCheckedChange}
                className="mt-1"
            />
            <div className="grid gap-1.5">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm bg-secondary px-2 py-0.5 rounded">
                        {route.method}
                    </span>
                    <span className="font-mono text-sm">{route.path}</span>
                </div>
                {route.description && (
                    <p className="text-xs text-muted-foreground">{route.description}</p>
                )}
                {route.group && (
                    <p className="text-xs text-muted-foreground">Group: {route.group}</p>
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90%] overflow-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingPermission ? 'Edit Permission' : 'Add New Permission'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Permission Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Can Approve Leave Requests"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this permission allows..."
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label>API Routes</Label>
                        
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search routes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="available">
                                    Available Routes
                                </TabsTrigger>
                                <TabsTrigger value="selected">
                                    Selected Routes ({selectedRoutes.length})
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="available" className="mt-4">
                                <div className="border rounded-md p-4 max-h-60 overflow-auto">
                                    {getFilteredAvailableRoutes().length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2 p-2">
                                                <Checkbox
                                                    id="select-all-available"
                                                    checked={isAllSelectedOnCurrentTab()}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                                <Label htmlFor="select-all-available" className="text-sm">
                                                    Select all filtered routes
                                                </Label>
                                            </div>
                                            <div className="border-t" />
                                            {getFilteredAvailableRoutes().map((route, index) => (
                                                <RouteItem
                                                    key={index}
                                                    route={route}
                                                    checked={selectedRoutes.some(selected => 
                                                        selected.method === route.method && selected.path === route.path
                                                    )}
                                                    onCheckedChange={(checked) => 
                                                        handleRouteSelection(route, checked)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-4">
                                            {searchTerm ? 'No matching routes found' : 'No available routes'}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="selected" className="mt-4">
                                <div className="border rounded-md p-4 max-h-60 overflow-auto">
                                    {getFilteredSelectedRoutes().length > 0 ? (
                                        <div className="space-y-2">
                                            {getFilteredSelectedRoutes().map((route, index) => (
                                                <RouteItem
                                                    key={index}
                                                    route={route}
                                                    checked={true}
                                                    onCheckedChange={() => 
                                                        handleRouteSelection(route, false)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-4">
                                            {searchTerm ? 'No matching selected routes found' : 'No routes selected'}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {errors.routes && <p className="text-red-500 text-sm">{errors.routes}</p>}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        {editingPermission ? 'Update Permission' : 'Create Permission'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PermissionDialog;