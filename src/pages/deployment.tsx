import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/layout';
import { toast } from 'sonner';
import { TDeployment } from '@/types';
import { useGlobalState } from '@/hooks';
import DeploymentComponent from '@/components/deployment-component';

export default function DeploymentPage() {
  const router = useRouter();
  const { repo } = router.query;
  const { deployments } = useGlobalState();
  const [deployment, setDeployment] = useState<TDeployment | null>(null);

  useEffect(() => {
    if (!repo || typeof repo !== 'string') {
      return;
    }

    const foundDeployment = deployments.find(d => d.Name === repo);
    if (!foundDeployment) {
      toast.error('Deployment not found');
      router.push('/dashboard');
      return;
    }

    setDeployment(foundDeployment);
  }, [repo, deployments, router]);

  if (!deployment) {
    return <Layout>
      <div className="text-xl">Searching for deployment...</div>
    </Layout>;
  }

  return <DeploymentComponent deployment={deployment} />;
}