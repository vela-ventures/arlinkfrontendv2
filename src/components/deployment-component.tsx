import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { connect } from '@permaweb/aoconnect';
import { toast } from 'sonner';
import Ansi from '@agbishop/react-ansi-18';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card-hover-effect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Github, LinkIcon, Loader, GitBranch, GitCommit, ExternalLink, RotateCw, Trash2, Pencil, Save } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import useDeploymentManager from '@/hooks/useDeploymentManager';
import { BUILDER_BACKEND } from '@/lib/utils';
import { runLua } from '@/lib/ao-vars';
import { setArnsName } from '@/lib/ao-vars';
import { TDeployment } from '@/types';


interface DeploymentComponentProps {
    deployment: TDeployment;
  }

  
  export default function DeploymentComponent({ deployment }: DeploymentComponentProps) {
  const globalState = useGlobalState();
  const { managerProcess, deployments, refresh } = useDeploymentManager();
  const router = useRouter();
  const name = router.query.name;
  const [buildOutput, setBuildOutput] = useState('');
  const [antName, setAntName] = useState('');
  const [redeploying, setRedeploying] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('buildLogs');
  const [updatingArns, setUpdatingArns] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState({
    installCommand: deployment?.InstallCMD || '',
    buildCommand: deployment?.BuildCMD || '',
    outputDir: deployment?.OutputDIR || ''
  });

  useEffect(() => {
    if (!deployment?.RepoUrl) return;
    const fetchDeploymentUrl = async () => {
      const owner = deployment.RepoUrl.split('/').reverse()[1];
      const repoName = deployment.RepoUrl.split('/').reverse()[0].replace('.git', '');
      try {
        const response = await axios.get(`${BUILDER_BACKEND}/config/${owner}/${repoName}`);
        const newDeploymentUrl = response.data.url;
        const arnsUnderName = response.data.arnsUnderName
        setDeploymentUrl(newDeploymentUrl);
        setAntName(arnsUnderName);
        
        // Update the DeploymentId in the database
        if (globalState.managerProcess && newDeploymentUrl) {
          await runLua(`db:exec[[UPDATE Deployments SET DeploymentId='${newDeploymentUrl}' WHERE Name='${deployment.Name}']]`, globalState.managerProcess);
        }
      } catch (error) {
        console.error('Error fetching deployment URL:', error);
        toast.error('Failed to fetch deployment URL');
        setError('Failed to fetch deployment URL. Using last known deployment ID.');
        setDeploymentUrl(deployment.DeploymentId || "");
      }
    };
    fetchDeploymentUrl();
  }, [deployment, globalState.managerProcess]);

  useEffect(() => {
    if (!deployment?.RepoUrl) return;
    const interval = setInterval(async () => {
      const folderName = deployment?.RepoUrl.replace(/\.git|\/$/, '').split('/').pop();
      const owner = deployment?.RepoUrl.split('/').reverse()[1];
      if (!redeploying) return clearInterval(interval);
      try {
        const logs = await axios.get(`${BUILDER_BACKEND}/logs/${owner}/${folderName}`);
        const rawLogsData = (logs.data).replaceAll(/\\|\||\-/g, '');
        
        // Trim logs to remove sensitive information
        const trimmedLogs = rawLogsData.split('\n')
          .reduce((acc: { started: boolean, logs: string[] }, line: string) => {
            if (acc.started || line.includes('Cloning repository...')) {
              acc.started = true;
              acc.logs.push(line);
            }
            return acc;
          }, { started: false, logs: [] as string[] });
        
        const safeLogsData = trimmedLogs.logs.join('\n');
        setBuildOutput(safeLogsData);

        // Create table if it doesn't exist and update logs
        if (globalState.managerProcess) {
          await runLua(`
            db:exec[[
              CREATE TABLE IF NOT EXISTS DeploymentLogs (
                DeploymentName TEXT PRIMARY KEY,
                Logs TEXT
              )
            ]]
            db:exec([[
              INSERT OR REPLACE INTO DeploymentLogs (DeploymentName, Logs)
              VALUES ('${deployment.Name}', '${safeLogsData.replace(/'/g, "''")}')
            ]])
          `, globalState.managerProcess);
        }

        setTimeout(() => {
          const logsDiv = document.getElementById('logs');
          logsDiv?.scrollTo({ top: logsDiv.scrollHeight, behavior: 'smooth' });
        }, 100);
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to fetch build logs. Please try again later.');
      }
    }, 1000);

    return () => { clearInterval(interval); };
  }, [redeploying, deployment?.RepoUrl, globalState.managerProcess]);

  const redeploy = async () => {
    if (!deployment) return;
    const projName = deployment.Name;
    const repoUrl = deployment.RepoUrl;
    const installCommand = deployment.InstallCMD;
    const buildCommand = deployment.BuildCMD;
    const outputDir = deployment.OutputDIR;
    const arnsProcess = deployment.ArnsProcess;
    const branch = deployment.Branch || 'main';
    setRedeploying(true);
    setBuildOutput('');
    setError(null);
    try {
      const txid = await axios.post(`${BUILDER_BACKEND}/deploy`, {
        repository: repoUrl,
        branch,
        installCommand,
        buildCommand,
        outputDir,
      });

      if (txid.status == 200) {
        toast.success('Deployment successful');

        await runLua('', arnsProcess, [
          { name: 'Action', value: 'Set-Record' },
          { name: 'Sub-Domain', value: '@' },
          { name: 'Transaction-Id', value: txid.data },
          { name: 'TTL-Seconds', value: '3600' },
        ]);

        await runLua(`db:exec[[UPDATE Deployments SET DeploymentId='${txid.data}' WHERE Name='${projName}']]`, globalState.managerProcess);

        router.push({ pathname: "/deployment", query: { repo: projName } });
        await refresh();
        window.open('https://arweave.net/' + txid.data, '_blank');

        setRedeploying(false);
      } else {
        toast.error('Deployment failed');
        console.log(txid);
        setRedeploying(false);
        setError('Deployment failed. Please try again.');
      }
    } catch (error) {
      toast.error('Deployment failed');
      console.log(error);
      setRedeploying(false);
      setError('An error occurred during deployment. Please try again later.');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!deployment) return;
    const owner = deployment?.RepoUrl.split('/').reverse()[1];
    const folderName = deployment?.RepoUrl.replace(/\.git|\/$/, '').split('/').pop();
    
    // Fetch logs from the database first
    if (globalState.managerProcess) {
      runLua(`
        local res = db:exec([[
          SELECT Logs FROM DeploymentLogs
          WHERE DeploymentName = '${deployment.Name}'
        ]])
        return res[1] and res[1].Logs or ''
      `, globalState.managerProcess).then(result => {
        if (result && typeof result === 'string') {
          setBuildOutput(result);
        }
      }).catch(error => {
        console.error('Error fetching logs from database:', error);
      });
    }

    // Then fetch the latest logs from the backend
    axios.get(`${BUILDER_BACKEND}/logs/${owner}/${folderName}`)
      .then((res) => {
        const rawLogsData = (res.data).replaceAll(/\\|\||\-/g, '');
        
        // Trim logs to remove sensitive information
        const trimmedLogs = rawLogsData.split('\n')
          .reduce((acc: {started: boolean, logs: string[]}, line: string) => {
            if (acc.started || line.includes('Cloning repository...')) {
              acc.started = true;
              acc.logs.push(line);
            }
            return acc;
          }, { started: false, logs: [] as string[] });
        
        const safeLogsData = trimmedLogs.logs.join('\n');
        setBuildOutput(safeLogsData);
        
        // Update logs in the database
        if (globalState.managerProcess) {
          runLua(`
            db:exec([[
              INSERT OR REPLACE INTO DeploymentLogs (DeploymentName, Logs)
              VALUES ('${deployment.Name}', '${safeLogsData.replace(/'/g, "''")}')
            ]])
          `, globalState.managerProcess);
        }
      })
      .catch((error) => {
        console.error('Error fetching logs:', error);
        setError('Failed to fetch build logs. Please try again later.');
      });

    connect().dryrun({
      process: deployment?.ArnsProcess,
      tags: [{ name: 'Action', value: 'Info' }]
    }).then(r => {
      if (r.Messages && r.Messages.length > 0) {
        const d = JSON.parse(r.Messages[0].Data);
        console.log(d);
        setAntName(d.Name);
      } else {
        console.error('No messages received or messages array is empty');
        setError('Failed to fetch ArNS information. Please try again later.');
      }
    }).catch(error => {
      console.error('Error during dryrun:', error);
      setError('An error occurred while fetching ArNS information. Please try again later.');
    });
  }, [deployment, globalState.managerProcess]);

  async function deleteDeployment() {
    if (!deployment) return toast.error('Deployment not found');
    if (!globalState.managerProcess) return toast.error('Manager process not found');

    const query = `local res = db:exec[[
      DELETE FROM Deployments
      WHERE Name = '${deployment.Name}'
    ]]`;
    console.log(query);

    try {
      const res = await runLua(query, globalState.managerProcess);
      if (res.Error) {
        toast.error(res.Error);
        setError('Failed to delete deployment. Please try again.');
        return;
      }
      console.log(res);
      await refresh();

      toast.success('Deployment deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting deployment:', error);
      toast.error('An error occurred while deleting the deployment');
      setError('Failed to delete deployment. Please try again later.');
    }
  }

  const updateArns = async () => {
    if (!deployment || !deploymentUrl) {
      toast.error('Deployment information is not available');
      return;
    }

    setUpdatingArns(true);
    try {
      await setArnsName(deployment.ArnsProcess, deploymentUrl);
      toast.success('ArNS update initiated successfully. This may take approximately 5 minutes to fully update.');
    } catch (error) {
      console.error('Error updating ArNS:', error);
      toast.error('Failed to update ArNS. Please try again.');
    } finally {
      setUpdatingArns(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!globalState.managerProcess || !deployment) return;
    
    try {
      const query = `
        db:exec[[
          UPDATE Deployments 
          SET InstallCMD = '${editedConfig.installCommand}',
              BuildCMD = '${editedConfig.buildCommand}',
              OutputDIR = '${editedConfig.outputDir}'
          WHERE Name = '${deployment.Name}'
        ]]
      `;
      
      const res = await runLua(query, globalState.managerProcess);
      if (res.Error) {
        toast.error(res.Error);
        return;
      }
      
      await refresh();
      setIsEditing(false);
      toast.success('Configuration updated successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    }
  };

  if (!deployment) return <Layout>
    <div className="text-xl">Searching <span className="text-muted-foreground">{name} </span> ...</div>
  </Layout>;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{deployment?.Name}</h1>
          <div className="space-x-2">
            <Button className="w-fit" onClick={redeploy} disabled={redeploying}>
              Deploy Latest <Loader className={redeploying ? "animate-spin ml-2" : "hidden"} />
            </Button>
            <Button className="w-fit" onClick={updateArns} disabled={updatingArns || !deploymentUrl}>
              Update ArNS {updatingArns && <Loader className="animate-spin ml-2" />}
            </Button>
          </div>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Production Deployment</h2>
              <p className="text-muted-foreground">The deployment that is available to your visitors.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-black rounded-lg overflow-hidden">
              {antName ? (
                <iframe
                  src={`https://${antName}_arlink.arweave.net/`}
                  className="w-full h-[300px] border-0"
                  title="Deployment Preview"
                />
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center bg-gray-800 text-white">
                  <p className="text-center">
                    Deployment URL not available.
                    <br />
                    Please check your deployment status.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Deployment URL</Label>
                <Link href={`https://arweave.net/${deploymentUrl || deployment?.DeploymentId}`} target="_blank" className="text-sm flex items-center">
                  {deploymentUrl ? `https://arweave.net/${deploymentUrl}` : (deployment?.DeploymentId ? `https://arweave.net/${deployment.DeploymentId}` : 'Not available')}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div>
                <Label>ArNS UnderName</Label>
                <div className="flex items-center space-x-2">
                  <Link href={`https://${antName ? antName : ''}_arlink.arweave.net`} target="_blank" className="text-sm flex items-center">
                    {(antName || '[fetching]') + '_arlink.arweave.net'}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={updateArns}
                    disabled={updatingArns || !deploymentUrl}
                  >
                    Update
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ready</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <GitBranch className="w-4 h-4" />
                  <span>{deployment.Branch}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <GitCommit className="w-4 h-4" />
                  <span>{deployment.DeploymentId?.substring(0, 7)}</span>
                </div>
              </div>
              <Link href={deployment?.RepoUrl || ''} target="_blank" className="text-sm flex items-center gap-1 hover:underline underline-offset-4">
                <Github size={16} />{deployment?.RepoUrl}
              </Link>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Deployment Configuration</h3>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {isEditing && (
              <Button variant="default" size="sm" onClick={handleSaveConfig}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Git Repository URL</Label>
              <Input value={deployment.RepoUrl} readOnly />
            </div>
            <div>
              <Label>Branch</Label>
              <Input value={deployment.Branch} readOnly />
            </div>
            <div>
              <Label>Install Command</Label>
              <Input 
                value={isEditing ? editedConfig.installCommand : deployment.InstallCMD}
                onChange={(e) => setEditedConfig(prev => ({ ...prev, installCommand: e.target.value }))}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label>Build Command</Label>
              <Input 
                value={isEditing ? editedConfig.buildCommand : deployment.BuildCMD}
                onChange={(e) => setEditedConfig(prev => ({ ...prev, buildCommand: e.target.value }))}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label>Output Directory</Label>
              <Input 
                value={isEditing ? editedConfig.outputDir : deployment.OutputDIR}
                onChange={(e) => setEditedConfig(prev => ({ ...prev, outputDir: e.target.value }))}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="buildLogs">Build Logs</TabsTrigger>
            <TabsTrigger value="deploymentHistory">Deployment History</TabsTrigger>
          </TabsList>
          <TabsContent value="buildLogs">
            <Card>
              <pre className="overflow-scroll max-h-[350px] font-mono" id="logs">
                <Ansi log ={buildOutput || 'No build logs available.'}/>
              </pre>
            </Card>
          </TabsContent>
          <TabsContent value="deploymentHistory">
            <Card>
              <pre className="overflow-scroll max-h-[350px] font-mono">
                Deployment history is not available in this demo.
              </pre>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center">
          <Button variant="destructive" onClick={deleteDeployment} disabled={redeploying}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Deployment
          </Button>
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <p className="text-sm text-muted-foreground">
            To update your Production Deployment, push to the {deployment.Branch} branch.
            <Button variant="link" className="ml-2">Learn More</Button>
          </p>
        </div>
      </div>
    </Layout>
  );
}