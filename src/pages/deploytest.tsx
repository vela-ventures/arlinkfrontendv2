"use client"

import { useState } from "react"
import { Github, Globe, ArrowLeft, ArrowRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Ansi from '@agbishop/react-ansi-18';
import Layout from '@/components/layout';

export default function ImportPage() {
  const [step, setStep] = useState<"initial" | "provider" | "repositories" | "project" | "domain" | "deploy">("initial")
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedOrg, setSelectedOrg] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>("")
  const [installCommand, setInstallCommand] = useState<string>("npm install")
  const [buildCommand, setBuildCommand] = useState<string>("npm run build")
  const [selectedDomain, setSelectedDomain] = useState<string>("")
  const [deploymentLogs, setDeploymentLogs] = useState<string>("")
  const [isDeploying, setIsDeploying] = useState<boolean>(false)
  const [outputDirectory, setOutputDirectory] = useState<string>("")

  const organizations = ["internettrashh", "myorg", "anotherorg"]
  const repositories = [
    { name: "gianet-AI-video-generator", updatedAt: "1d ago" },
    { name: "gianetsubmission2", updatedAt: "2d ago" },
    { name: "codespaces-blank", updatedAt: "2d ago", isPrivate: true },
    { name: "Gaianet-submission", updatedAt: "10d ago" },
    { name: "publishAOSmodule", updatedAt: "15d ago" },
  ]
  const domains = ["example.com", "myapp.vercel.app", "custom-domain.com"]

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider)
    setStep("repositories")
  }

  const handleRepoSelect = (repoName: string) => {
    setSelectedRepo(repoName)
    setProjectName(repoName)
    setStep("project")
  }

  const handleDeploy = () => {
    setIsDeploying(true)
    setStep("deploy")
    // Simulating deployment process
    let logs = ""
    const updateLogs = (newLog: string) => {
      logs += newLog + "\n"
      setDeploymentLogs(logs)
    }

    updateLogs("Starting deployment...")
    setTimeout(() => updateLogs("Cloning repository..."), 1000)
    setTimeout(() => updateLogs("Installing dependencies..."), 3000)
    setTimeout(() => updateLogs("Building project..."), 6000)
    setTimeout(() => {
      updateLogs("Deployment successful!")
      setIsDeploying(false)
    }, 8000)
  }

  const handleBack = () => {
    switch (step) {
      case "repositories":
        setStep("initial")
        break
      case "project":
        setStep("repositories")
        break
      case "domain":
        setStep("project")
        break
      case "deploy":
        if (!isDeploying) {
          setStep("domain")
        }
        break
    }
  }

  const handleNext = () => {
    switch (step) {
      case "project":
        setStep("domain")
        break
      case "domain":
        handleDeploy()
        break
    }
  }

  return (
    <Layout>
    <div className="min-h-screen">
      <header className="flex justify-between items-center p-6 border-b border-border bg-transparent">
        <div>
          <h1 className="text-2xl font-bold">Import Project</h1>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {step === "initial" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select a Git provider to import an existing project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                className="flex items-center justify-center space-x-2 h-16 bg-primary/80 hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={() => handleProviderSelect("github")}
              >
                <Github className="w-6 h-6" />
                <span>Import from GitHub</span>
              </Button>
              <Button
                className="flex items-center justify-center space-x-2 h-16 bg-secondary/80 hover:bg-secondary/90 text-secondary-foreground shadow-lg"
                onClick={() => handleProviderSelect("other")}
              >
                <Globe className="w-6 h-6" />
                <span>Import from Other Git Providers</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Or, deploy a template to get started with a pre-built project
            </p>
          </div>
        )}

        {step === "repositories" && (
          <div className="space-y-6">
            <div className="flex space-x-4">
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px] bg-card/50 shadow-md">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 bg-card/50 shadow-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              {filteredRepositories.map((repo) => (
                <div key={repo.name} className="flex items-center justify-between bg-card/50 p-4 rounded-md shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-md"></div>
                    <div>
                      <p className="font-medium">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">{repo.updatedAt}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleRepoSelect(repo.name)}
                    className="bg-background/50 shadow-md"
                  >
                    Import
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "project" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 bg-card/50 shadow-md"
              />
            </div>
            <div>
              <Label htmlFor="output-directory">Output Directory</Label>
              <Input
                id="output-directory"
                value={outputDirectory}
                onChange={(e) => setOutputDirectory(e.target.value)}
                className="mt-1 bg-card/50 shadow-md"
                placeholder="/"
              />
            </div>
            <div>
              <Label htmlFor="install-command">Install Command</Label>
              <Input
                id="install-command"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                className="mt-1 bg-card/50 shadow-md"
              />
            </div>
            <div>
              <Label htmlFor="build-command">Build Command</Label>
              <Input
                id="build-command"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="mt-1 bg-card/50 shadow-md"
              />
            </div>
          </div>
        )}

        {step === "domain" && (
          <div className="space-y-4">
            <Label htmlFor="domain">Select Domain</Label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger id="domain" className="w-full bg-card/50 shadow-md">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === "deploy" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Deployment Logs</h2>
            <div className="bg-card/50 p-4 rounded-md h-64 overflow-y-auto shadow-lg">
              <Ansi log={deploymentLogs}/>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {step !== "initial" && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === "deploy" && isDeploying}
              className="bg-background/50 shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {(step === "project" || step === "domain") && (
            <Button
              className="ml-auto bg-primary/80 hover:bg-primary/90 shadow-lg"
              onClick={handleNext}
            >
              {step === "domain" ? "Deploy" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>

      <footer className="mt-8 p-6 border-t border-border text-center text-muted-foreground bg-transparent">
        <a href="#" className="hover:text-foreground">Learn more about importing projects →</a>
      </footer>
    </div>
    </Layout>
  )
}
