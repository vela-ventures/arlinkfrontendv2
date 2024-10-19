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

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10 w-[800px]"
            placeholder="Search Repositories and Projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Sort by newest</SelectItem>
              <SelectItem value="created">Sort by oldest</SelectItem>
              <SelectItem value="name">Sort by name</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setViewMode('grid')}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setViewMode('list')}>
            <List className="w-4 h-4" />
          </Button>
          
        </div>
      </div>

      {!managerProcess && <div className="text-xl"><Loader className="animate-spin m-5 mx-auto" /></div>}
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
            <Link href={project.link} key={project.id} className="block">
              <div className="group relative p-4 rounded-lg border transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 h-40 w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-md" style={{
                   background: 'linear-gradient(to bottom right, #00ff00, #32cd32, #98fb98, #00fa9a, #00bfff, #ffd700)'
                   }}></div>
                    <div className="overflow-hidden">
                    <div>
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{project.url}</p>
                    </div>
                  </div>
                  </div >
                  <p className="text-sm text-gray-400 truncate">{project.repo}</p>
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
