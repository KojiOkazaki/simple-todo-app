import { useState } from 'react';
import { AppScreen, InterviewConfig, InterviewFeedbackData } from './types';
import InterviewSetup from './components/InterviewSetup';
import InterviewSession from './components/InterviewSession';
import InterviewFeedback from './components/InterviewFeedback';
import './App.css';

function App() {
  const [screen, setScreen] = useState<AppScreen>('setup');
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig | null>(null);
  const [scenarioId, setScenarioId] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState<InterviewFeedbackData | null>(null);

  const handleStart = (config: InterviewConfig, selectedScenarioId: string) => {
    setInterviewConfig(config);
    setScenarioId(selectedScenarioId);
    setScreen('session');
  };

  const handleFinish = (feedback: InterviewFeedbackData) => {
    setFeedbackData(feedback);
    setScreen('feedback');
  };

  const handleRestart = () => {
    setInterviewConfig(null);
    setScenarioId('');
    setFeedbackData(null);
    setScreen('setup');
  };

  const handleBack = () => {
    setScreen('setup');
  };

  return (
    <div className="app">
      {screen === 'setup' && (
        <InterviewSetup onStart={handleStart} />
      )}
      {screen === 'session' && interviewConfig && (
        <InterviewSession
          config={interviewConfig}
          scenarioId={scenarioId}
          onFinish={handleFinish}
          onBack={handleBack}
        />
      )}
      {screen === 'feedback' && feedbackData && (
        <InterviewFeedback
          feedback={feedbackData}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
