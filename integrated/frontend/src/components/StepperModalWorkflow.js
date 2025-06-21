import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import ChatTab from './ChatTab';
import SurveyTab from './SurveyTab';
import VideoTab from './VideoTab';
import SpeechTab from './SpeechTab';

const steps = [
  { label: 'Audio', key: 'Audio', component: SpeechTab },
  { label: 'Chat', key: 'Chat', component: ChatTab },
  { label: 'Video', key: 'Video', component: VideoTab },
  { label: 'Survey', key: 'Survey', component: SurveyTab },
];

// Wrapper for each step to extract sentiment and score
function StepWrapper({ StepComponent, onSubmit, isModalStep }) {
  const [localResult, setLocalResult] = useState(null);
  // This assumes each tab exposes an onSubmit prop and calls it with the backend result
  const handleStepSubmit = (result) => {
    // Try to extract sentiment and score from the result
    let sentiment = result?.sentiment || result?.primary_emotion || result?.dominant_emotion || 'Neutral';
    let score = result?.sentiment_score || result?.emotion_score || result?.score || 0;
    // If score is 0-1, convert to percent
    if (score <= 1) score = score * 100;
    onSubmit({ sentiment, score });
  };
  return <StepComponent onSubmit={handleStepSubmit} isModalStep={isModalStep} />;
}

export default function StepperModalWorkflow({ visible, onHide }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState({});
  const [show, setShow] = useState(visible);
  const navigate = useNavigate();

  React.useEffect(() => {
    setShow(visible);
    if (visible) console.log('StepperModalWorkflow opened');
  }, [visible]);

  React.useEffect(() => {
    if (show) console.log(`Showing step: ${steps[step].label}`);
  }, [show, step]);

  // Handler for when a step is submitted
  const handleStepSubmit = (result) => {
    setResults(prev => ({ ...prev, [steps[step].key]: result }));
    handleNext();
  };
  const handleSkip = () => {
    setResults(prev => ({ ...prev, [steps[step].key]: null }));
    handleNext();
  };
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setShow(false);
      onHide && onHide();
      navigate('/dashboard', { state: { results } });
    }
  };
  const handleCancel = () => {
    setShow(false);
    onHide && onHide();
  };

  const StepComponent = steps[step].component;
  return (
    <Dialog header={steps[step].label + ' Input'} visible={show} style={{ width: '60vw', minWidth: 320 }} modal onHide={handleCancel} closable={false}>
      <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <StepWrapper StepComponent={StepComponent} onSubmit={handleStepSubmit} isModalStep />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          {step < steps.length - 1 && (
            <Button label="Next" className="p-button-info" onClick={handleNext} />
          )}
          <Button label="Skip" className="p-button-secondary" onClick={handleSkip} />
          <Button label="Cancel" className="p-button-text" onClick={handleCancel} />
        </div>
      </div>
    </Dialog>
  );
} 