"use client";

/*
  // This page lets Product Owners manage organizations.
  //
  // add, edit, or remove organizations will be here.
  // Only Product Managers have access to this page.
*/

import React, { useState, useEffect, useContext } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    Filter,
    ChevronDown,
    Users,
    Building2,
    Globe,
} from 'lucide-react';
import { CreateOrganizationDialog } from './components/CreateOrganization';
import OrganizationApi from '@/Apis/Organization_Management';
import OrgCard from './components/OrgCard';
import { UsersContext } from '../context/UserContext';
import ProfileDropdown from '../components/ProfileDropdown';
import Link from 'next/link';

// Skeleton is used to show loading placeholders
import { Skeleton } from "@/components/ui/skeleton";
import FiltersCard from './components/FiltersCard';

// There is no User Data for Product Owner so We are keeping it like this static data
const user = {
    firstName: "Product",
    lastName: "Owner",
    email: "admin@gmail.com",
    personalEmail: "admin@gmail.com",
    // profileImage: "https://via.placeholder.com/150",
}

const OrganizationsPage = () => {
    // State for triggering a refresh of organization data
    const [getOrgDetails, setGetOrgDetails] = useState(false);
    // All organizations from the API
    const [organizations, setOrganizations] = useState([]);
    // What the user is searching for
    const [searchTerm, setSearchTerm] = useState('');
    // Filter: 'all', 'withHead', or 'withoutHead'
    const [filter, setFilter] = useState('all');
    // Error message, if any
    const [error, setError] = useState(null);
    // Loading state for API calls
    const [loading, setLoading] = useState(true);
    // Get user role and privilege from context
    const { role, previlege } = useContext(UsersContext);

    // Fetch organization data from the backend
    async function getDetails() {
        setError(null);
        setLoading(true);
        try {
            const data = await OrganizationApi.GettingOraganizationDatawithHead();
            // The API gives us an array of organizations, each may have organizationHeads as an object or be empty
            if (data.success) {
                setOrganizations([...data?.data]);
            } else {
                setOrganizations([]);
            }
        } catch (err) {
            setError(err?.message || "Failed to fetch organizations");
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    }

    // Fetch organizations when the page loads or when getOrgDetails changes
    useEffect(() => {
        getDetails();
    }, [getOrgDetails]);

    // Filter organizations based on search and filter selection
    const filteredOrganizations = organizations.filter(org => {
        // Does the org match the search term?
        const matchesSearch =
            (org.name && org.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (org.gstNumber && org.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        let matchesFilter = false;
        if (filter === 'all') {
            matchesFilter = true;
        } else if (filter === 'withHead') {
            // organizationHeads is an object if present
            matchesFilter = org.organizationHeads && typeof org.organizationHeads === 'object' && Object.keys(org.organizationHeads).length > 0;
        } else if (filter === 'withoutHead') {
            matchesFilter = !org.organizationHeads || Object.keys(org.organizationHeads).length === 0;
        }
        return matchesSearch && matchesFilter;
    });

    // Get initials from a name, like "John Doe" => "JD"
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        let initials = names[0].substring(0, 1).toUpperCase();
        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }
        return initials;
    };

    // When a new organization is added, refresh the list
    const handleOrganizationAdded = () => {
        setError(null);
        setGetOrgDetails(prev => !prev);
    };

    // When an organization is updated, update it in the local state to reduce number of API calls
    const handleOrganizationUpdated = (updatedOrg) => {
        setOrganizations(organizations.map(org =>
            org._id === updatedOrg._id ? updatedOrg : org
        ));
    };

    // When an organization is deleted, remove it from the local state to reduce number of API calls
    const handleOrganizationDeleted = (deletedId) => {
        setOrganizations(organizations.filter(org => org._id !== deletedId));
    };

    // When an organization's head is updated, update it in the local state to reduce number of API calls
    const handleHeadUpdated = (updatedHead) => {
        setOrganizations(organizations.map(org => {
            if (org.organizationHeads && org.organizationHeads._id === updatedHead._id) {
                return { ...org, organizationHeads: updatedHead };
            }
            return org;
        }));
    };

    // Calculate stats for the cards at the top
    const totalOrganizations = organizations.length;
    const organizationsWithHead = organizations.filter(
        org => org.organizationHeads && typeof org.organizationHeads === 'object' && Object.keys(org.organizationHeads).length > 0
    ).length;
    const organizationsWithoutHead = totalOrganizations - organizationsWithHead;

    // Only users with the "PRODUCTMANAGER" role can see this page
    if (!role || role !== "PRODUCTMANAGER") {
        return (
            <div className="flex flex-col gap-4 items-center justify-center min-h-screen">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                    You have no permission to access this page
                </div>
                <Link href="/login"><Button>Login</Button></Link>
            </div>
        );
    }

    // Turn any error into a readable string
    const renderError = (err) => {
        if (!err) return null;
        if (typeof err === "string") return err;
        if (typeof err === "object") {
            if (err.message && typeof err.message === "string") return err.message;
            return JSON.stringify(err);
        }
        return String(err);
    };

    // Show skeletons for the stats cards while loading
    const StatsSkeletons = () => (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
            {[1, 2, 3].map((i) => (
                <Card key={i} className={` hover:shadow-md transition-shadow duration-200`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-32 rounded" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-24 rounded" />
                    </CardContent>
                </Card>
            ))}
        </section>
    );

    // Show skeletons for the organization grid while loading
    const OrgGridSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className={` flex flex-col gap-4 p-6`}>
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-6 w-2/3 rounded mb-1" />
                    <Skeleton className="h-4 w-1/2 rounded mb-2" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <div className="flex gap-2 mt-2">
                        <Skeleton className="h-8 w-20 rounded" />
                        <Skeleton className="h-8 w-20 rounded" />
                    </div>
                </Card>
            ))}
        </div>
    );

    // Render the page
    return (
        <div className="min-h-screen w-full bg-white dark:bg-black px-3 sm:px-6 md:px-10 lg:px-16 py-4 md:py-10 transition-colors duration-300">
            <div className="w-full mx-auto">
                {/* 
          Header: Page title, description, create organization button, and profile dropdown
        */}
                <header className="w-full flex flex-col gap-6 md:gap-0 md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-7 w-7 text-black dark:text-neutral-50" />
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Organization Management
                            </h1>
                        </div>
                        <p className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 font-medium mt-1 pl-1">
                            Manage all your organizations in one place
                        </p>
                    </div>
                    <div className="w-full md:w-auto flex items-center justify-start md:justify-end mt-4 md:mt-0 gap-4">
                        {/* Add a new organization */}
                        <CreateOrganizationDialog onSuccess={handleOrganizationAdded} refresh={getDetails} />
                        {/* User profile dropdown */}
                        <ProfileDropdown user={user} showAccount={false} />
                    </div>
                </header>

                {/* 
          Stats cards: show total, with heads, and without heads. Show skeletons if loading.
        */}
                {loading ? (
                    <StatsSkeletons />
                ) : (
                    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                        <FiltersCard
                            title="Total Organizations"
                            cnt={totalOrganizations}
                            icon={<Building2 className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />}
                        />
                        <FiltersCard
                            title="With Heads"
                            cnt={organizationsWithHead}
                            icon={<Users className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />}
                        />
                        <FiltersCard
                            title="Without Heads"
                            cnt={organizationsWithoutHead}
                            icon={<Users className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
                        />
                    </section>
                )}

                {/* 
          Show an error card if something went wrong
        */}
                {error && (
                    <div className="mb-6">
                        <Card className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 p-4">
                            <CardTitle className="text-red-700 dark:text-red-300 text-lg mb-2">Error</CardTitle>
                            <CardDescription className="text-red-600 dark:text-red-400 text-base">
                                {renderError(error)}
                            </CardDescription>
                        </Card>
                    </div>
                )}

                {/* 
          Search and filter bar: search by name or GST, filter by all/with/without heads
        */}
                <section className="flex flex-col sm:flex-row gap-4 mb-8 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                        <Input
                            placeholder="Search organizations..."
                            className="pl-11 py-3 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-emerald-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 px-5 py-3 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 font-medium shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all" disabled={loading}>
                                <Filter className="h-5 w-5" />
                                <span>
                                    {filter === 'all' ? 'All' : filter === 'withHead' ? 'With Heads' : 'Without Heads'}
                                </span>
                                <ChevronDown className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="dark:bg-neutral-900 dark:border-neutral-800">
                            <DropdownMenuItem onClick={() => setFilter('all')}>
                                All Organizations
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('withHead')}>
                                With Heads
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('withoutHead')}>
                                Without Heads
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </section>

                {/* 
          Organization cards grid: shows all organizations, or a message if none found, or skeletons if loading
        */}
                {loading ? (
                    <OrgGridSkeletons />
                ) : filteredOrganizations.length === 0 ? (
                    // No organizations found
                    <Card className={` flex flex-col items-center justify-center p-12 text-center`}>
                        <Globe className="h-14 w-14 text-neutral-300 mb-4" />
                        <CardTitle className="text-2xl text-neutral-600 dark:text-neutral-300 mb-2 font-bold">
                            No organizations found
                        </CardTitle>
                        <CardDescription className="text-neutral-500 dark:text-neutral-400 mb-4 text-base">
                            {searchTerm ? 'Try a different search term' : 'Create your first organization to get started'}
                        </CardDescription>
                        <CreateOrganizationDialog onSuccess={handleOrganizationAdded} refresh={getDetails}>
                        </CreateOrganizationDialog>
                    </Card>
                ) : (
                    // Show the grid of organization cards
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrganizations.map((org) => (
                            <OrgCard
                                refresh={getDetails}
                                key={org._id}
                                org={org}
                                getInitials={getInitials}
                                handleOrganizationUpdated={handleOrganizationUpdated}
                                handleOrganizationDeleted={handleOrganizationDeleted}
                                handleHeadUpdated={handleHeadUpdated}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationsPage;