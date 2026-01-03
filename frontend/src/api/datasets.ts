
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Dataset {
    id: number;
    name: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    // stats placeholder
    asset_count?: number; 
}

export const getDatasets = async (): Promise<Dataset[]> => {
    const response = await axios.get(`${API_URL}/datasets/`);
    return response.data;
};

export const createDataset = async (name: string, description: string): Promise<Dataset> => {
    const response = await axios.post(`${API_URL}/datasets/`, { name, description });
    return response.data;
};
