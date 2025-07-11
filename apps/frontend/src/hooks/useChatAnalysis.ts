import { useMutation } from '@tanstack/react-query';
import { analyzeChatFile, CompleteAnalysisResponse } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

export const useChatFileAnalysis = () => {
  const { showSuccess, showError } = useNotification();

  const mutation = useMutation<CompleteAnalysisResponse, Error, { file: File; user_id?: string }>({
    mutationFn: ({ file, user_id }) => analyzeChatFile(file, user_id),
    onSuccess: () => {
      showSuccess('File analyzed successfully!');
    },
    onError: (error) => {
      showError(error.message || 'Failed to analyze file.');
    },
  });

  return {
    analyzeFile: (file: File, user_id?: string) => mutation.mutate({ file, user_id }),
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearData: mutation.reset,
  };
}; 