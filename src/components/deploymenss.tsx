import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranch, GitCommit, ExternalLink, RotateCw, Trash2, Clock, User } from 'lucide-react'
import Ansi from "@agbishop/react-ansi-18"
import Layout from "@/components/layout"
import { Card } from "@/components/ui/card-hover-effect"

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('buildLogs')
  const [isDeploying, setIsDeploying] = useState(false)

  const projectData = {
    name: 'gianetsubmission2-yntk',
    deploymentUrl: 'gianetsubmission2-yntk-rbuf678ne-internettrashhs-projects.vercel.app',
    domains: ['gianetsubmission2-yntk.vercel.app'],
    status: 'Ready',
    createdAt: '57s ago',
    createdBy: 'internettrashh',
    branch: 'main',
    commit: '14ffaa7',
    commitMessage: 'push',
    repoUrl: 'https://github.com/internettrashh/gianetsubmission2',
    installCommand: 'npm install',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
  }

  const [logs, setLogs] = useState('')

  const handleDeploy = () => {
    setIsDeploying(true)
    setActiveTab('buildLogs')
    // Simulating deployment process
    let deploymentLogs = ''
    const updateLogs = (newLog: string) => {
      deploymentLogs += newLog + '\n'
      setLogs(deploymentLogs)
    }

    updateLogs('Starting deployment...')
    setTimeout(() => updateLogs('Cloning repository...'), 1000)
    setTimeout(() => updateLogs('Installing dependencies...'), 3000)
    setTimeout(() => updateLogs('Building project...'), 6000)
    setTimeout(() => {
      updateLogs('Deployment successful!')
      setIsDeploying(false)
    }, 8000)
  }

  return (
    
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{projectData.name}</h1>
        </div>

        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Production Deployment</h2>
              <p className="text-muted-foreground">The deployment that is available to your visitors.</p>
            </div>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => setActiveTab('buildLogs')}>Build Logs</Button>
              <Button variant="default" onClick={handleDeploy} disabled={isDeploying}>
            <RotateCw className="w-4 h-4  " />
            {isDeploying ? 'Deploying...' : 'Deploy Latest Commit'}
          </Button>
             
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-black rounded-lg overflow-hidden">
              <img src="/placeholder.svg?height=300&width=600" alt="Deployment Preview" className="w-full h-[300px] object-cover" />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Deployment</Label>
                <p className="text-sm">{projectData.deploymentUrl}</p>
              </div>
              <div>
                <Label>ARNS</Label>
                {projectData.domains.map(domain => (
                  <p key={domain} className="text-sm flex items-center">
                    {domain}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </p>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{projectData.status}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
               
                <User className="w-4 h-4 ml-2" />
                <span>by {projectData.createdBy}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <GitBranch className="w-4 h-4" />
                  <span>{projectData.branch}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <GitCommit className="w-4 h-4" />
                  <span>{projectData.commit}</span>
                  <span>{projectData.commitMessage}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Deployment Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Git Repository URL</Label>
              <Input value={projectData.repoUrl} readOnly />
            </div>
            <div>
              <Label>Custom Domain (ARN)</Label>
              <Input value={projectData.domains[0]} readOnly />
            </div>
            <div>
              <Label>Install Command</Label>
              <Input value={projectData.installCommand} readOnly />
            </div>
            <div>
              <Label>Build Command</Label>
              <Input value={projectData.buildCommand} readOnly />
            </div>
            <div>
              <Label>Output Directory</Label>
              <Input value={projectData.outputDirectory} readOnly />
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="buildLogs">Build Logs</TabsTrigger>
            <TabsTrigger value="runtimeLogs">Deployment history</TabsTrigger>
          </TabsList>
          <TabsContent value="buildLogs">
            <Card>
              <pre className="overflow-scroll max-h-[350px] font-mono">
                {/* <Ansi>{logs ? logs : 'No build logs available.'}</Ansi> */}
              </pre>
            </Card>
          </TabsContent>
          <TabsContent value="runtimeLogs">
            <Card>
              <pre className="overflow-scroll max-h-[350px] font-mono">
                {/* <Ansi>Runtime logs are not available in this demo.</Ansi> */}
              </pre>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center">
          
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Deployment
          </Button>
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <p className="text-sm text-muted-foreground">
            To update your Production Deployment, push to the &apos;main&apos; branch.
            <Button variant="link" className="ml-2">Learn More</Button>
          </p>
        </div>
      </div>
   
  )
}
