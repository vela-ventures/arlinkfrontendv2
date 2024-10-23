import { useRouter } from 'next/router';
import Deployment from './deployments/[name]';

export default function DeploymentPage() {
  const router = useRouter();
  const { name } = router.query;

  if (!name || typeof name !== 'string') {
    return <div>Loading...</div>;
  }

  return <Deployment />;
}