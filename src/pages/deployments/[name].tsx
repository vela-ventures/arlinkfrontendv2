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
import { Github, LinkIcon, Loader, GitBranch, GitCommit, ExternalLink, RotateCw, Trash2 } from 'lucide-react';
import { useGlobalState } from '@/hooks';
import useDeploymentManager from '@/hooks/useDeploymentManager';
import { BUILDER_BACKEND } from '@/lib/utils';
import { runLua } from '@/lib/ao-vars';

export default function Deployment() {
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
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null);

  const deployment = globalState.deployments.find((dep) => dep.Name == name);

  useEffect(() => {
    if (!deployment?.RepoUrl) return;
    const fetchDeploymentUrl = async () => {
      const owner = deployment.RepoUrl.split('/').reverse()[1];
      const repoName = deployment.RepoUrl.split('/').reverse()[0].replace('.git', '');
      try {
        const response = await axios.get(`${BUILDER_BACKEND}/config/${owner}/${repoName}`);
        setDeploymentUrl(response.data.url);
        if (response.data.url) {
          fetchSnapshot(`https://arweave.net/${response.data.url}`);
        }
      } catch (error) {
        console.error('Error fetching deployment URL:', error);
        toast.error('Failed to fetch deployment URL');
        setError('Failed to fetch deployment URL. Please try again later.');
        setSnapshotImage(null);
      }
    };
    fetchDeploymentUrl();
  }, [deployment]);

  useEffect(() => {
    if (!deployment?.RepoUrl) return;
    const interval = setInterval(async () => {
      const folderName = deployment?.RepoUrl.replace(/\.git|\/$/, '').split('/').pop();
      const owner = deployment?.RepoUrl.split('/').reverse()[1];
      if (!redeploying) return clearInterval(interval);
      try {
        const logs = await axios.get(`${BUILDER_BACKEND}/logs/${owner}/${folderName}`);
        setBuildOutput((logs.data).replaceAll(/\\|\||\-/g, ''));
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
  }, [redeploying, deployment?.RepoUrl]);

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

        router.push('/deployments/' + projName);
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
    axios.get(`${BUILDER_BACKEND}/logs/${owner}/${folderName}`)
      .then((res) => {
        setBuildOutput((res.data).replaceAll(/\\|\||\-/g, ''));
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
  }, [deployment]);

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

  const fetchSnapshot = async (url: string) => {
    try {
      const response = await axios.get(`https://api.apiflash.com/v1/urltoimage`, {
        params: {
          access_key: process.env.NEXT_PUBLIC_APIFLASH_KEY,
          url: url,
          format: 'jpeg',
          quality: 80,
          width: 1200,
          height: 600,
        },
        responseType: 'arraybuffer',
      });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      setSnapshotImage(`data:image/jpeg;base64,${base64}`);
    } catch (error) {
      console.error('Error fetching snapshot:', error);
      setSnapshotImage(null);
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
          <Button className="w-fit" onClick={redeploy} disabled={redeploying}>
            Deploy Latest <Loader className={redeploying ? "animate-spin ml-2" : "hidden"} />
          </Button>
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
              {snapshotImage ? (
                <img src={snapshotImage} alt="Deployment Preview" className="w-full h-[300px] object-cover" />
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center bg-gray-800 text-white">
                  <p className="text-center">
                    {deploymentUrl ? 'Something went wrong while fetching the snapshot.' : 'Deployment URL not available.'}
                    <br />
                    Please check your deployment status.
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Deployment URL</Label>
                <Link href={`https://arweave.net/${deploymentUrl}`} target="_blank" className="text-sm flex items-center">
                  {deploymentUrl ? `https://arweave.net/${deploymentUrl}` : 'Loading...'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div>
                <Label>ArNS</Label>
                <Link href={`https://${antName}.arweave.net`} target="_blank" className="text-sm flex items-center">
                  {(antName || '[fetching]') + '.arweave.net'}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
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
          <h3 className="text-lg font-semibold mb-4">Deployment Configuration</h3>
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
              <Input value={deployment.InstallCMD} readOnly />
            </div>
            <div>
              <Label>Build Command</Label>
              <Input value={deployment.BuildCMD} readOnly />
            </div>
            <div>
              <Label>Output Directory</Label>
              <Input value={deployment.OutputDIR} readOnly />
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
