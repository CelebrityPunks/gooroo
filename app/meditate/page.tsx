import MeditateLobby from './MeditateLobby';
import { listTechniques } from '../../lib/techniques';

export default function MeditatePage() {
  const techniques = listTechniques();
  return <MeditateLobby techniques={techniques} />;
}
