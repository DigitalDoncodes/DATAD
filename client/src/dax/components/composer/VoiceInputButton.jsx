import { Mic } from 'lucide-react';
import IconButton from '../common/IconButton';
import Tooltip from '../common/Tooltip';

// Placeholder — no speech-to-text wired yet.
export default function VoiceInputButton({ onClick }) {
  return (
    <Tooltip label={onClick ? 'Voice input' : 'Voice input — coming soon'}>
      <IconButton icon={Mic} label="Voice input" disabled={!onClick} onClick={onClick} />
    </Tooltip>
  );
}
