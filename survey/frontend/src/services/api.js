import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const transformData = (data) => {
    return {
        'Designation': parseFloat(data.Designation),
        'Resource_Allocation': parseFloat(data['Resource Allocation']),
        'Mental_Fatigue_Score': parseFloat(data['Mental Fatigue Score']),
        'Company_Type': data['Company Type'],
        'WFH_Setup_Available': data['WFH Setup Available'],
        'Gender': data.Gender
    };
};

export const predictBurnout = async (data) => {
    const transformedData = transformData(data);
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get prediction');
    }

    const result = await response.json();
    // Add current timestamp if not provided by backend
    if (!result.prediction_time) {
        result.prediction_time = new Date().toISOString();
    }
    return result;
};

export default api; 