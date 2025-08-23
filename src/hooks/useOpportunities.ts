import { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import * as opportunityService from '../services/opportunities';

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunityService.getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  const createOpportunity = async (opportunity: Omit<Opportunity, 'id'>) => {
    try {
      const newOpportunity = await opportunityService.createOpportunity(opportunity);
      // Update state immediately to reflect the new opportunity
      setOpportunities(prev => [newOpportunity, ...prev]);
      return newOpportunity;
    } catch (err) {
      console.error('Error creating opportunity:', err);
      throw err;
    }
  };

  const updateOpportunity = async (id: string, opportunity: Partial<Omit<Opportunity, 'id'>>) => {
    try {
      const updatedOpportunity = await opportunityService.updateOpportunity(id, opportunity);
      // Update state immediately to reflect the changes
      setOpportunities(prev => 
        prev.map(opp => opp.id === id ? updatedOpportunity : opp)
      );
      return updatedOpportunity;
    } catch (err) {
      console.error('Error updating opportunity:', err);
      throw err;
    }
  };

  const deleteOpportunity = async (id: string): Promise<void> => {
    try {
      await opportunityService.deleteOpportunity(id);
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return {
    opportunities,
    loading,
    error,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refreshOpportunities: fetchOpportunities
  };
};