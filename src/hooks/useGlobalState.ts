// src/hooks/useGlobalState.ts
import { TDeployment } from '@/types';
import { create } from 'zustand';

type Store = {
    managerProcess: string;
    deployments: TDeployment[];
    githubToken: string | null; // Add githubToken state
    setManagerProcess: (managerProcess: string) => void;
    setDeployments: (deployments: TDeployment[]) => void;
    setGithubToken: (token: string | null) => void; // Add setGithubToken function
}

export const useGlobalState = create<Store>()((set) => ({
    managerProcess: "",
    deployments: [],
    githubToken: null, // Initialize githubToken state
    setManagerProcess: (managerProcess: string) => set({ managerProcess }),
    setDeployments: (deployments: TDeployment[]) => set({ deployments }),
    setGithubToken: (token: string | null) => set({ githubToken: token }) // Implement setGithubToken
}));