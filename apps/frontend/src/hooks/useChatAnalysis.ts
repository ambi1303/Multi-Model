import { useMutation } from '@tanstack/react-query';
import { analyzeChatFile, CompleteAnalysisResponse } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export const useChatFileAnalysis = () => {
  const { showSuccess, showError } = useNotification();

  const mutation = useMutation<CompleteAnalysisResponse, Error, File>({
    mutationFn: (file: File) => analyzeChatFile(file),
    onSuccess: () => {
      showSuccess('File analyzed successfully!');
    },
    onError: (error) => {
      showError(error.message || 'Failed to analyze file.');
    },
  });

  return {
    analyzeFile: mutation.mutate,
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearData: mutation.reset,
  };
}; 