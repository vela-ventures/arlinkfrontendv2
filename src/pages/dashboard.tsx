"use client"

import React, { useEffect, useState, useMemo } from "react";
import { Loader, Search, Grid, List, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConnection, useActiveAddress } from "arweave-wallet-kit";
import Layout from "@/components/layout";
import useDeploymentManager from "@/hooks/useDeploymentManager";
import { TDeployment } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";


const Dashboardcomp = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("activity");
  const { connected } = useConnection();
  const address = useActiveAddress();
  const { managerProcess, deployments, refresh } = useDeploymentManager();

  useEffect(() => {
    console.log("connected", connected, address);
    refresh();
  }, [connected, address, refresh]);

  const formatProjectData = (deployments: TDeployment[]) => {
    return deployments.map((dep: TDeployment) => ({
      id: dep.ID,
      name: dep.Name,
      url: dep.RepoUrl,
      repo: dep.RepoUrl.split('/').slice(-2).join('/'),
      link: `/deployments/${dep.Name}`,
      createdAt: dep.ID // Using ID as a proxy for creation time
    }));
  };

  const projects = useMemo(() => formatProjectData(deployments), [deployments]);

  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.repo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "created") {
          return a.createdAt - b.createdAt;
        }
        // Default to "activity" (which is the reverse order of the original array)
        return b.createdAt - a.createdAt;
      });
  }, [projects, searchTerm, sortBy]);

  const SkeletonCards = () => (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="block">
          <div className="p-4 rounded-lg border border-zinc-800 bg-black">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="w-8 h-8 rounded-md bg-zinc-800" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/3 bg-zinc-800 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10 w-[875px] bg-black border-zinc-800 focus:border-zinc-700 focus-visible:ring-zinc-700"
            placeholder="Search Repositories and Projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-black border-zinc-800 focus:ring-zinc-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-black border-zinc-800">
              <SelectItem value="activity">Sort by newest</SelectItem>
              <SelectItem value="created">Sort by oldest</SelectItem>
              <SelectItem value="name">Sort by name</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setViewMode('grid')}
            className="border-zinc-800 bg-black hover:bg-zinc-900 hover:border-zinc-700"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setViewMode('list')}
            className="border-zinc-800 bg-black hover:bg-zinc-900 hover:border-zinc-700"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!managerProcess && (
        <div className="relative">
          <SkeletonCards />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader className="animate-spin w-8 h-8 text-zinc-400" />
          </div>
        </div>
      )}
      
      {managerProcess && deployments.length === 0 && (
        <div className="text-muted-foreground mx-auto text-center">
          No deployments yet<br />
          <Link href="/deploy">
            <Button variant="link" className="text-muted-foreground p-0">Click here to create one</Button>
          </Link>
        </div>
      )}
      {managerProcess && deployments.length > 0 && (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4 ` }>
          {filteredAndSortedProjects.map((project) => (
              <Link 
              href={`/deployment?repo=${project.name}`}
              key={project.id} 
              className="block"
            >
              <div className="group relative p-4 rounded-lg border border-zinc-800 transition-colors duration-200 
                  hover:border-slate-400 bg-black">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-md" style={{
                        background: 'linear-gradient(to bottom right, #00ff00, #32cd32, #98fb98, #00fa9a, #00bfff, #ffd700)'
                    }}></div>
                    <div className="overflow-hidden">
                      <div>
                        <h3 className="font-semibold truncate text-zinc-200">{project.name}</h3>
                        <p className="text-sm text-zinc-400 truncate">{project.url}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{project.repo}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Dashboardcomp;
